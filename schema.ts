import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { text, password, checkbox } from "@keystone-6/core/fields";

export const lists = {
  // TODO: learn more about access control
  User: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      recoveryPhrase: password(),
      isAdmin: checkbox(),
    },
  }),
};
