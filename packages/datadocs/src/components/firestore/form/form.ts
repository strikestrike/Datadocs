import * as yup from "yup";

export type FormResult = {
  docId: string;
  password: string;
};

export const schema = yup.object({
  docId: yup.string().required("Please select a Firestore document"),
  password: yup.string().required("Please enter the password for testing"),
});

