const EVENTS = {
  ERROR: (path) => `[Error]${path}`,
  SUBSCRIBE: (path) => `[Subscribe]${path}`,
  PUBLISH: (path) => `[Publish]${path}`,
};

module.exports = EVENTS;
