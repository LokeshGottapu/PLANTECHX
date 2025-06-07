class MockSpacy {
    constructor() {
        this.nlp = {
            load: () => ({
                pipe: () => [],
                vocab: {
                    strings: new Set(['test', 'mock', 'word'])
                }
            })
        };
    }
}

module.exports = new MockSpacy(); 