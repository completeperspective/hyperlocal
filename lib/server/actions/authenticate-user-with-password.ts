'use server'

import { keystoneContext } from '../keystone/context'

type FormState = {
  authenticateUserWithPassword: {
    sessionToken?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item?: any
    message?: string
  }
}

export async function authenticateUserWithPassword(
  formState: FormState,
  formData: FormData,
) {
  try {
    const session: FormState = await keystoneContext.sudo().graphql.run({
      query: `
        mutation Login($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, recoveryPhrase: $password) {
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
        email: formData.get('email'),
        password: formData.get('password'),
      },
    })

    if (session?.authenticateUserWithPassword?.sessionToken) {
      // Prepare json data for nextjs client
      const data = JSON.parse(
        JSON.stringify({ ...session?.authenticateUserWithPassword }),
      )

      return data
    }

    return {
      message: session?.authenticateUserWithPassword?.message,
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log('There was an error:\n', e.message)
    } else {
      console.log('There was an unknown error:\n', e)
    }
  }
}
