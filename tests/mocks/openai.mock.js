class MockOpenAI {
    async createCompletion() {
        return {
            data: {
                choices: [{
                    text: 'Mock completion response'
                }]
            }
        };
    }

    async createChatCompletion() {
        return {
            data: {
                choices: [{
                    message: {
                        content: 'Mock chat completion response'
                    }
                }]
            }
        };
    }
}

module.exports = {
    Configuration: class {},
    OpenAIApi: MockOpenAI
}; 