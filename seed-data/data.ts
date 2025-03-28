import { connect } from "http2";

export const settings = [
  {
    title: "App Name",
    description: "Open source community engagement platform",
    copyrightText: "- made with ♥ by complete perspective -",
    theme: {
      create: {
        name: "Default",
        colorPrimary: "#368cbf",
        colorPrimaryDark: "#1e90ff",
        fontPrimary: "'Lobster', serif",
        fontSecondary: "'Open Sans', sans-serif",
      },
    },
    homePage: {
      create: {
        title: "Home",
        description: "This platform is designed to help you engage with your community in a more meaningful way.",
        author: { connect: { email: "admin@example.com" } },
        status: "published",
        content: [
          {
            type: "heading",
            level: 1,
            children: [
              {
                text: "Home",
              },
            ],
          },
          {
            type: "paragraph",
            children: [
              {
                text: "This is the default home page content. You can edit this page in the admin panel.",
              },
            ],
          },
        ],
      },
    },
  },
];

export const pages = [
  {
    title: "About",
    slug: "about",
    author: { connect: { email: "admin@example.com" } },
    description: "Learn more about our mission and values.",
    status: "published",
    content: [
      {
        type: "heading",
        level: 1,
        children: [
          {
            text: "About Us",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "This is the default about page content. You can edit this page in the admin panel.",
          },
        ],
      },
    ],
  },
  {
    title: "Contact",
    description: "Get in touch with us.",
    author: { connect: { email: "admin@example.com" } },
    status: "published",
    content: [
      {
        type: "heading",
        level: 1,
        children: [
          {
            text: "Contact",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "This is the default contact page content. You can edit this page in the admin panel.",
          },
        ],
      },
    ],
  },
];

export const posts = [
  {
    title: "Hello World",
    author: { connect: { email: "admin@example.com" } },
    description: "Welcome to the community!",
    status: "published",
    content: [
      {
        type: "heading",
        level: 1,
        children: [
          {
            text: "Hello World",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "This is the default post content. You can edit this post in the admin panel.",
          },
        ],
      },
    ],
    images: [
      {
        title: "Cat",
        description: "image of a cat",
        image: "./assets/cat_1080x1080.png",
        altText: "image of a cat",
      },
    ],
  },
  {
    title: "Getting Started",
    description: "Learn how to use the platform.",
    author: { connect: { email: "admin@example.com" } },
    status: "published",
    content: [
      {
        type: "heading",
        level: 1,
        children: [
          {
            text: "Getting Started",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "This is the default post content. You can edit this post in the admin panel.",
          },
        ],
      },
    ],
    images: [
      {
        title: "Steamed Mussels",
        description: "image of a pot full of muscles",
        image: "./assets/pot-mussels_1080x1080.png",
        altText: "image of a pot full of muscles",
      },
    ],
  },
  {
    title: "Community Guidelines",
    description: "Learn the rules of engagement.",
    author: { connect: { email: "admin@example.com" } },
    status: "published",
    content: [
      {
        type: "heading",
        level: 1,
        children: [
          {
            text: "Community Guidelines",
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            text: "This is the default post content. You can edit this post in the admin panel.",
          },
        ],
      },
    ],
    images: [
      {
        title: "Reindeer",
        description: "image of a reindeer",
        image: "./assets/reindeer_1080x1080.png",
        altText: "image of a reindeer",
      },
    ],
  },
];
