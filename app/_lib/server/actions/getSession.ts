"use server";

import { keystoneContext } from "../keystone";

type FormState = {
  authenticateUserWithPassword: {
    sessionToken?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item?: any;
    message?: string;
  };
};

export async function getSessionToken(formState: FormState, formData: FormData) {
  console.log(formData.get("email"), formData.get("password"));
  try {
    const session: FormState = await keystoneContext.graphql.run({
      query: `
        mutation Login($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
              ... on UserAuthenticationWithPasswordSuccess {
                sessionToken
                item {
                  id
                  email
                  isAdmin
                }
              }
              ... on UserAuthenticationWithPasswordFailure {
                message
              }
          }
      }`,
      variables: {
        email: formData.get("email"),
        password: formData.get("password"),
      },
    });

    console.log({ session });

    if (session?.authenticateUserWithPassword?.sessionToken) {
      return JSON.parse(JSON.stringify(session?.authenticateUserWithPassword));
    }

    return {
      message: session?.authenticateUserWithPassword?.message,
    };
  } catch (e: any) {
    console.log("There was an error:\n", e);
  }
}
