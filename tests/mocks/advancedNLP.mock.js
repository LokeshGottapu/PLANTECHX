class MockAdvancedNLP {
    async extractTopics(content) {
        return [
            { text: 'test topic', weight: 5 }
        ];
    }

    async analyzeSemanticRelations(content) {
        return [
            {
                token: 'test token',
                children: [{ text: 'test child' }]
            }
        ];
    }

    async findContextualPatterns(content) {
        return {
            cause_effect: ['test cause effect'],
            comparison: ['test comparison'],
            sequence: ['test sequence']
        };
    }

    async enrichTermsWithContext(terms) {
        return terms.map(term => ({
            ...term,
            context: 'test context',
            related: ['test related']
        }));
    }
}

module.exports = MockAdvancedNLP; 