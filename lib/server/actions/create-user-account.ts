'use server'

import { keystoneContext } from '../keystone/context'

type FormState = {
  createUser: {
    name?: string
    email?: string
    isAdmin?: boolean
    message?: string
  }
}

export async function createUserAccount(
  formState: FormState,
  formData: FormData,
) {
  try {
    // validate email is not taken
    const emailExists = await keystoneContext.query.User.findOne({
      where: { email: formData.get('email') as string },
    })

    if (emailExists) {
      return {
        message: 'Account already exists',
      }
    }

    const newUser: FormState = await keystoneContext.graphql.run({
      query: `
        mutation CreateUser($data: UserCreateInput!) {
          createUser(data: $data) {
            name
            email
            isAdmin
          }
        }
      `,
      variables: {
        data: {
          name: formData.get('name'),
          email: formData.get('email'),
          recoveryPhrase: formData.get('password'),
        },
      },
    })

    console.log({ newUser })

    if (newUser?.createUser) {
      // Prepare json data for nextjs client
      const data = JSON.parse(JSON.stringify(newUser?.createUser))

      return data
    }

    return {
      message: 'Failed to create account',
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log('There was an error:\n', e.message)
    } else {
      console.log('There was an unknown error', e)
    }
    return {
      message: 'Failed to create account',
    }
  }
}
