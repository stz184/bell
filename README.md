# Implementation Details

**Used libraries:**

- Request Promise Native (request-promise-native)
- WebSocket (ws)
- Sinon
- Chai
- Mocha



Design decisions: 

I have used `request-promise-native` instead of native `http` node.js module, because it supports promises and allows me to chain the requests.

`ws` module is used as WebSocket client instead of Pusher library, because I had troubles establishing connections with the official Pusher client.

The test is wrapped as `mocha` test file, because JavaScript is my language of choice. The test itself has prolonged timeout (10s instead of the default of 2s) in order to ensure enough time for all API request to be executed. 

The test only asserts that the push notification is received and it does not care about the API requests. 