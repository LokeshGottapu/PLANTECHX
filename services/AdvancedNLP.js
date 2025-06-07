const natural = require('natural');
const pos = require('pos');
const compromise = require('compromise');
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const spacy = require('spacy');

class AdvancedNLP {
    constructor() {
        try {
            this.nlpInstance = winkNLP(model);
            this.its = this.nlpInstance.its;
            this.as = this.nlpInstance.as;
            this.tagger = new pos.Tagger();
            this.tokenizer = new natural.WordTokenizer();
            this.tfidf = new natural.TfIdf();
            this.wordnet = new natural.WordNet();
            this.spacyNLP = spacy.load('en_core_web_sm');
        } catch (error) {
            console.error('Failed to initialize NLP components:', error);
            throw new Error('NLP initialization failed: ' + error.message);
        }
    }

    async analyzeSemanticRelations(text) {
        if (!text || typeof text !== 'string') {
            const error = new Error('Invalid input: text must be a non-empty string');
            console.error('analyzeSemanticRelations validation error:', error);
            throw error;
        }

        try {
            const doc = await this.spacyNLP(text);
            const relations = [];

        for (const token of doc) {
            if (token.dep_ !== 'punct') {
                relations.push({
                    token: token.text,
                    dependency: token.dep_,
                    head: token.head.text,
                    children: Array.from(token.children).map(c => ({
                        text: c.text,
                        dependency: c.dep_
                    }))
                });
            }
        }

            return relations;
        } catch (error) {
            const enhancedError = new Error(`Failed to analyze semantic relations: ${error.message}. Please ensure spaCy model is properly loaded and text is properly formatted.`);
            console.error('Error in analyzeSemanticRelations:', {
                error: error.message,
                text: text.substring(0, 100) + '...',
                stack: error.stack
            });
            throw enhancedError;
        }
    }

    async extractTopics(text) {
        if (!text || typeof text !== 'string') {
            const error = new Error('Invalid input: text must be a non-empty string');
            console.error('extractTopics validation error:', error);
            throw error;
        }

        try {
            const doc = this.nlpInstance.readDoc(text);
            const topics = new Map();

        // Extract noun phrases and entities
        doc.nounPhrases().each(phrase => {
            const text = phrase.text();
            topics.set(text, (topics.get(text) || 0) + 1);
        });

        doc.entities().each(entity => {
            const text = entity.text();
            topics.set(text, (topics.get(text) || 0) + 2); // Entities get higher weight
        });

        // Sort by frequency and convert to array
            return Array.from(topics.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([text, weight]) => ({ text, weight }));
        } catch (error) {
            const enhancedError = new Error(`Failed to extract topics: ${error.message}. Please check if the text contains valid content and NLP instance is properly initialized.`);
            console.error('Error in extractTopics:', {
                error: error.message,
                text: text.substring(0, 100) + '...',
                stack: error.stack
            });
            throw enhancedError;
        }
    }

    async findContextualPatterns(text) {
        if (!text || typeof text !== 'string') {
            const error = new Error('Invalid input: text must be a non-empty string');
            console.error('findContextualPatterns validation error:', error);
            throw error;
        }

        try {
            const doc = await this.spacyNLP(text);
            const patterns = {
            temporal: [],
            causal: [],
            comparative: [],
            conditional: []
        };

        for (const sent of doc.sents) {
            const sentText = sent.text;

            // Temporal patterns
            if (/\b(before|after|during|while|when)\b/i.test(sentText)) {
                patterns.temporal.push(sentText);
            }

            // Causal patterns
            if (/\b(because|therefore|thus|hence|since|as a result)\b/i.test(sentText)) {
                patterns.causal.push(sentText);
            }

            // Comparative patterns
            if (/\b(more than|less than|similar to|different from|like|unlike)\b/i.test(sentText)) {
                patterns.comparative.push(sentText);
            }

            // Conditional patterns
            if (/\b(if|unless|provided that|assuming|suppose)\b/i.test(sentText)) {
                patterns.conditional.push(sentText);
            }
        }

            return patterns;
        } catch (error) {
            const enhancedError = new Error(`Failed to find contextual patterns: ${error.message}. Please verify the text format and spaCy model availability.`);
            console.error('Error in findContextualPatterns:', {
                error: error.message,
                text: text.substring(0, 100) + '...',
                stack: error.stack
            });
            throw enhancedError;
        }
    }

    async enrichTermsWithContext(terms) {
        if (!Array.isArray(terms) || terms.length === 0) {
            const error = new Error('Invalid input: terms must be a non-empty array');
            console.error('enrichTermsWithContext validation error:', error);
            throw error;
        }
        
        terms.forEach((term, index) => {
            if (!term || (typeof term !== 'object' && typeof term !== 'string')) {
                const error = new Error(`Invalid term at index ${index}: term must be an object or string`);
                console.error('enrichTermsWithContext validation error:', error);
                throw error;
            }
        });

        try {
            return Promise.all(terms.map(async term => {
            const synsets = await new Promise(resolve => {
                this.wordnet.lookup(term.text || term.term, results => resolve(results));
            });

            const doc = await this.spacyNLP(term.text || term.term);
            const token = doc[0];

            return {
                ...term,
                synonyms: synsets.map(synset => synset.synonyms).flat(),
                definition: synsets[0]?.definition || '',
                pos: token.pos_,
                lemma: token.lemma_,
                vector: Array.from(token.vector)
            };
            }));
        } catch (error) {
            const enhancedError = new Error(`Failed to enrich terms with context: ${error.message}. Please ensure WordNet database is accessible and terms are properly formatted.`);
            console.error('Error in enrichTermsWithContext:', {
                error: error.message,
                terms: terms.slice(0, 3),
                stack: error.stack
            });
            throw enhancedError;
        }
    }
}

module.exports = AdvancedNLP;