import * as React from "react";
import { Primer } from "@primer-io/react-native";
import { View, Text, useColorScheme, TouchableOpacity } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import {
  createClientSession,
  createPayment,
  resumePayment,
  setClientSessionActions,
} from "../network/api";
import { styles } from "../styles";
import type { IAppSettings } from "../models/IAppSettings";
import type { IClientSessionRequestBody } from "../models/IClientSessionRequestBody";
import type {
  OnClientSessionActionsCallback,
  OnPrimerErrorCallback,
  OnTokenizeSuccessCallback,
} from "@primer-io/react-native/lib/typescript/models/primer-callbacks";
import type { IClientSession } from "../models/IClientSession";
import { makeRandomString } from "../helpers/helpers";
import type { IPayment } from "../models/IPayment";
import { PrimerPaymentMethodIntent } from "@primer-io/react-native/lib/typescript/models/primer-intent";

import { OnResumeCallback } from "@primer-io/react-native/lib/typescript//models/primer-callbacks";
//import { IPrimerConfig } from "@primer-io/react-native/lib/typescript/models/primer-config";
import type { IPrimerConfig as PrimerConfig } from "@primer-io/react-native/lib/typescript/models/primer-config";
import { useNavigation } from "@react-navigation/native";
// import type { PrimerConfig } from "@primer-io/react-native/lib/typescript/models/primer-config";

let currentClientToken: string | null = null;
let paymentId: string | null = null;

const CheckoutScreen = (props: any) => {
  const isDarkMode = useColorScheme() === "dark";
  const [error, setError] = React.useState<Error | null>(null);
  const navigation = useNavigation();
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const appSettings: IAppSettings = props.route.params;

  const clientSessionRequestBody: IClientSessionRequestBody = {
    customerId: appSettings.customerId,
    orderId: "rn-test-" + makeRandomString(8),
    currencyCode: appSettings.currencyCode,
    order: {
      countryCode: appSettings.countryCode,
      lineItems: [
        {
          amount: appSettings.amount,
          quantity: 1,
          itemId: "item-123",
          description: "this item",
          discountAmount: 0,
        },
      ],
    },
    customer: {
      emailAddress: "test@mail.com",
      mobileNumber: appSettings.phoneNumber,
      firstName: "John",
      lastName: "Doe",
      billingAddress: {
        firstName: "John",
        lastName: "Doe",
        postalCode: "12345",
        addressLine1: "1 test",
        addressLine2: undefined,
        countryCode: appSettings.countryCode,
        city: "test",
        state: "test",
      },
      shippingAddress: {
        firstName: "John",
        lastName: "Doe",
        addressLine1: "1 test",
        postalCode: "12345",
        city: "test",
        state: "test",
        countryCode: appSettings.countryCode,
      },
      nationalDocumentId: "9011211234567",
    },
    paymentMethod: {
      vaultOnSuccess: true,
      // options: {
      //   GOOGLE_PAY: {
      //     surcharge: {
      //       amount: 50,
      //     },
      //   },
      //   ADYEN_IDEAL: {
      //     surcharge: {
      //       amount: 50,
      //     },
      //   },
      //   ADYEN_SOFORT: {
      //     surcharge: {
      //       amount: 50,
      //     },
      //   },
      //   APPLE_PAY: {
      //     surcharge: {
      //       amount: 150,
      //     },
      //   },
      //   PAYMENT_CARD: {
      //     networks: {
      //       VISA: {
      //         surcharge: {
      //           amount: 100,
      //         },
      //       },
      //       MASTERCARD: {
      //         surcharge: {
      //           amount: 200,
      //         },
      //       },
        //  },
     //   },
      },
    },
  };

  // const onClientSessionActions: OnClientSessionActionsCallback = async (clientSessionActions, resumeHandler) => {
  //     if (currentClientToken) {
  //         const clientSessionActionsRequestBody: any = {
  //             clientToken: currentClientToken,
  //             actions: clientSessionActions
  //         };

  //         const clientSession: IClientSession = await setClientSessionActions(clientSessionActionsRequestBody);
  //         currentClientToken = clientSession.clientToken;
  //         resumeHandler?.handleNewClientToken(currentClientToken);
  //     } else {
  //         const err = new Error("Failed to find client token");
  //         resumeHandler?.handleError(err?.message);
  //     }
  // }

  const onTokenizeSuccess: OnTokenizeSuccessCallback = async (
    paymentInstrument,
    resumeHandler
  ) => {
    try {
      const payment: IPayment = await createPayment(paymentInstrument.token);

      if (payment.requiredAction && payment.requiredAction.clientToken) {
        paymentId = payment.id;

        if (payment.requiredAction.name === "3DS_AUTHENTICATION") {
          console.warn(
            "Make sure you have used a card number that supports 3DS, otherwise the SDK will hang."
          );
        }
        paymentId = payment.id;
        resumeHandler.handleNewClientToken(payment.requiredAction.clientToken);
      } else {
        navigation.navigate("Result", payment);
        resumeHandler.handleSuccess();
      }
    } catch (err) {
      if (resumeHandler) {
        if (err instanceof Error) {
          resumeHandler.handleError(err.message);
        } else if (typeof err === "string") {
          resumeHandler.handleError(err);
        } else {
          resumeHandler.handleError("Unknown error");
        }
      }
    }
  };

  const onResumeSuccess: OnResumeCallback = async (
    resumeToken,
    resumeHandler
  ) => {
    try {
      if (paymentId) {
        const payment: IPayment = await resumePayment(paymentId, resumeToken);
        navigation.navigate("Result", payment);

        if (resumeHandler) {
          resumeHandler.handleSuccess();
        }
      } else {
        const err = new Error("Invalid value for paymentId");
        throw err;
      }
      paymentId = null;
    } catch (err) {
      paymentId = null;

      if (resumeHandler) {
        if (err instanceof Error) {
          resumeHandler.handleError(err);
        } else if (typeof err === "string") {
          resumeHandler.handleError(new Error(err));
        } else {
          resumeHandler.handleError(new Error("Unknown error"));
        }
      }
    }
  };

  const onDismiss = () => {
    currentClientToken = null;
  };

  const onError: OnPrimerErrorCallback = async (
    primerError,
    _resumeHandler
  ) => {
    console.error(primerError.errorDescription);
  };

  const onUniversalCheckoutButtonTapped = async () => {
    try {
      const clientSession: IClientSession = await createClientSession(
        clientSessionRequestBody
      );
      currentClientToken = clientSession.clientToken;

      const primerConfig: PrimerConfig = {
        settings: {
          options: {
            isResultScreenEnabled: true,
            isLoadingScreenEnabled: true,
            is3DSDevelopmentModeEnabled: true,
            ios: {
              urlScheme: "primer",
              merchantIdentifier: "merchant.checkout.team",
            },
            // android: {
            //   redirectScheme: "primer",
            // },
          },
        },
        // onClientSessionActions: onClientSessionActions,
        onTokenizeSuccess: onTokenizeSuccess,
        onResumeSuccess: onResumeSuccess,
        onError: onError,
        onDismiss: onDismiss,
      };
      console.log("cleint token", currentClientToken);
      console.log("primerConfig", primerConfig);
      //@ts-ignore
      Primer.showUniversalCheckout(currentClientToken, primerConfig);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else if (typeof err === "string") {
        setError(new Error(err));
      } else {
        setError(new Error("Unknown error"));
      }
    }
  };

  const onApplePayButtonTapped = async () => {
    try {
      const clientSession: IClientSession = await createClientSession(
        clientSessionRequestBody
      );
      currentClientToken = clientSession.clientToken;

      const primerConfig = {
        settings: {
          options: {
            isResultScreenEnabled: true,
            isLoadingScreenEnabled: true,
            is3DSDevelopmentModeEnabled: true,
            ios: {
              urlScheme: "primer",
              merchantIdentifier: "merchant.checkout.team",
            },
            android: {
              redirectScheme: "primer",
            },
          },
        },
        // onClientSessionActions: onClientSessionActions,
        onTokenizeSuccess: onTokenizeSuccess,
        onResumeSuccess: onResumeSuccess,
      };

      const intent: PrimerPaymentMethodIntent = {
        vault: false,
        paymentMethod: "APPLE_PAY",
      };

      //@ts-ignore
      Primer.showPaymentMethod(currentClientToken, intent, primerConfig);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else if (typeof err === "string") {
        setError(new Error(err));
      } else {
        setError(new Error("Unknown error"));
      }
    }
  };

  return (
    <View style={backgroundStyle}>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        style={{
          ...styles.button,
          marginHorizontal: 20,
          marginVertical: 5,
          backgroundColor: "black",
        }}
        onPress={onApplePayButtonTapped}
      >
        <Text style={{ ...styles.buttonText, color: "white" }}>Apple Pay</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
                style={{ ...styles.button, marginHorizontal: 20, marginVertical: 5, backgroundColor: 'black' }}
            >
                <Text
                    style={{ ...styles.buttonText, color: 'white' }}
                >
                    Vault Manager
                </Text>
            </TouchableOpacity> */}
      <TouchableOpacity
        style={{
          ...styles.button,
          marginHorizontal: 20,
          marginBottom: 20,
          marginTop: 5,
          backgroundColor: "black",
        }}
        onPress={onUniversalCheckoutButtonTapped}
      >
        <Text style={{ ...styles.buttonText, color: "white" }}>
          Universal Checkout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CheckoutScreen;
