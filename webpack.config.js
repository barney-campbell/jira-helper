const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [
  {
    mode: "development",
    entry: "./src/main/main.ts",
    target: "electron-main",
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "main.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  {
    mode: "development",
    entry: "./src/main/preload.ts",
    target: "electron-preload",
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "preload.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  {
    mode: "development",
    entry: "./src/renderer/index.tsx",
    target: "electron-renderer",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: /src/,
          use: [{ loader: "ts-loader" }],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "renderer.js",
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
  },
];
