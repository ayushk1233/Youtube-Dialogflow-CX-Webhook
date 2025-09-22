function buildTextResponse(text) {
  return {
    fulfillmentMessages: [
      {
        text: { text: [text] },
      },
    ],
  };
}

module.exports = { buildTextResponse };
