// jest.config.js
module.exports = {
  preset: 'react-native',
  transform: {
    "^.+\\.(js|jsx|mjs)$": "babel-jest",  // Ensure .mjs files are handled
  },
  // Transform files from these modules as well.
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|firebase|@firebase)/)"
  ],
  moduleFileExtensions: ["js", "jsx", "mjs"],
};
