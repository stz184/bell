const assert = require('chai').assert;
const sinon = require('sinon');
const rp = require('request-promise-native');
const WebSocket = require('ws');


describe('Agent profile', () => {
    const username = `random.user${(Math.random() + '').substr(2)}`;
    const password = '123Propy';
    const callback = sinon.fake();

    after(() => {
        sinon.restore();
    });

    describe('Profile completed', () => {
        it('should receive a Bell event when profile is completed', (done) => {
            let accessToken = '';
            let ws;        

            const registerUser = {
                method: 'POST',
                uri: 'https://dev.api.propy.com/api/v3/users/register',
                body: {
                    'email': `${username}@verify.me`,
                    'password': password
                },
                json: true
            };
             
            rp(registerUser)
                .then((data) => {            
                    ws = new WebSocket('ws://ws-mt1.pusher.com:80/app/c1f5c3f44164e55ece8e?version=4.4&protocol=5');   
                    ws.onopen = () => {
                        //Subscribe to the channel
                        ws.send(JSON.stringify(  
                            {
                                "event": "pusher:subscribe",
                                "data": {
                                "channel": `${data.data}_private` 
                                }
                            }
                        ));
                    };
                     
                    ws.onmessage = (msg) => {
                        const data = JSON.parse(msg.data);
                        if (data.event === 'Bell') {
                            callback(data);
                        }
                    };

                    const getToken = {
                        method: 'POST',
                        url: 'https://dev.api.identityserver.propy.com/connect/token',
                        body: `grant_type=password&username=${username}@verify.me&password=${password}&client_id=ro.client`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    };

                    return rp(getToken)
                })
                .then((getTokenResponse) => {
                    accessToken = JSON.parse(getTokenResponse).access_token;
                    
                    const addAgentRole = {
                        method: 'POST',
                        url: 'https://dev.api.propy.com/api/v3/users/roles',
                        body: {
                            'userRoles': [ //adds Agent role to the given user
                                'agent'
                            ]
                        },
                        json: true,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    };
            
                    return rp(addAgentRole);
                })
                .then(() => {
                    const addDetails = {
                        method: 'POST',
                        url: 'https://dev.api.propy.com/api/agents/info',
                        body: {
                            'screenName': 'Propy User', // random string
                            'licenseNumber': '12345test', // random string
                            'agencyId': '5b43b043b4daa32b7c7a1c98' // random hexadecimal string of length 24
                        },
                        json: true,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    };
            
                    return rp(addDetails);
                })
                .then(() => {
                    setTimeout(() => {
                        assert.isTrue(callback.called);
                        assert.equal(
                            JSON.parse(JSON.parse(callback.getCall(0).args[0].data)).message, 
                            'You\'ve just completed your agent profile and earned $100 bonus in PRO.'
                        )
                        ws.terminate();
                        done();
                    }, 1000);
                })
                .catch(function (err) {
                    console.error('Error', err);
                });
                
        }).timeout(10000);
    });
});
