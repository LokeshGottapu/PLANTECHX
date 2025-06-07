const natural = require('natural');
const { Configuration, OpenAIApi } = require('openai');
const AdvancedNLP = require('./AdvancedNLP');

// Initialize sentiment analyzer with lowercase 'english'
const analyzer = new natural.SentimentAnalyzer('english', natural.PorterStemmer, 'afinn');

class QuestionGenerator {
    constructor() {
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        }));
        this.analyzer = analyzer;
        this.nlp = new AdvancedNLP();
        this.contextualPatterns = {
            cause_effect: /because|therefore|thus|hence|consequently|as a result|due to|leads to|causes|affects/i,
            comparison: /compared to|similar to|different from|like|unlike|whereas|while|however|contrast|parallel/i,
            sequence: /first|then|next|finally|before|after|during|meanwhile|subsequently|following/i,
            problem_solution: /problem|solution|resolve|fix|address|overcome|mitigate|handle|manage|improve/i,
            analysis: /analyze|examine|investigate|evaluate|assess|consider|study|explore|review/i,
            hypothesis: /if|suppose|assume|given|consider|predict|estimate|hypothesize/i
        };

        this.questionTemplates = {
            definition: [
                'What is {term}?',
                'Define {term}.',
                'Explain the concept of {term}.',
                'What are the key characteristics of {term}?',
                'How would you describe {term} to someone new to this field?',
                'What distinguishes {term} from other related concepts?',
                'In what context is {term} most commonly used?',
                'What are the fundamental principles of {term}?'
            ],
            application: [
                'How would you apply {term} in a real-world scenario?',
                'What is an example of {term} in practice?',
                'Describe a situation where {term} would be most effective.',
                'How does {term} solve practical problems?',
                'What are the benefits of implementing {term}?',
                'How can {term} be optimized for different scenarios?',
                'What challenges might arise when implementing {term}?',
                'How would you adapt {term} for a specific industry context?',
                'What are the prerequisites for successfully applying {term}?'
            ],
            analysis: [
                'Compare and contrast {term1} and {term2}.',
                'What are the key components of {term}?',
                'Analyze the relationship between {term1} and {term2}.',
                'How does {term} impact the overall system?',
                'What are the potential limitations of {term}?',
                'How do different factors influence the effectiveness of {term}?',
                'What are the underlying mechanisms of {term}?',
                'How does {term} interact with other components in the system?',
                'What patterns emerge when analyzing {term} in different contexts?'
            ],
            evaluation: [
                'Evaluate the effectiveness of {term} in {context}.',
                'What are the pros and cons of using {term}?',
                'How would you measure the success of {term} implementation?',
                'What criteria would you use to assess the quality of {term}?',
                'How does {term} perform under different conditions?',
                'What are the trade-offs involved in using {term}?',
                'How reliable is {term} in achieving its intended purpose?',
                'What factors should be considered when evaluating {term}?'
            ],
            synthesis: [
                'How would you combine {term1} and {term2} to create a better solution?',
                'Propose a new approach using {term} to solve {context}.',
                'Design a system that incorporates {term} effectively.',
                'How could {term} be modified to address current limitations?',
                'What innovative applications of {term} could be developed?',
                'How would you integrate {term} with existing systems?',
                'What improvements would you suggest to enhance {term}?',
                'How could {term} be adapted for future challenges?'
            ],
            critical_thinking: [
                'What assumptions underlie the use of {term}?',
                'How might {term} evolve in the future?',
                'What ethical considerations are associated with {term}?',
                'How does {term} challenge conventional thinking?',
                'What alternative approaches could replace {term}?'
            ]

        };
    }

    async extractKeyTerms(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid input: content must be a non-empty string');
        }

        try {
            const terms = [];
            const topics = await this.nlp.extractTopics(content);
            const semanticRelations = await this.nlp.analyzeSemanticRelations(content);
            const contextualPatterns = await this.nlp.findContextualPatterns(content);
        
        // Process topics and add them as terms
        topics.forEach(topic => {
            terms.push({
                term: topic.text,
                type: 'topic',
                importance: topic.weight || 5
            });
        });

        // Process semantic relations
        semanticRelations.forEach(relation => {
            terms.push({
                term: relation.token,
                type: 'semantic',
                importance: 6,
                dependencies: relation.children
            });
        });

        // Process contextual patterns
        Object.entries(contextualPatterns).forEach(([type, sentences]) => {
            if (sentences.length > 0) {
                terms.push({
                    term: sentences[0],
                    type: type,
                    importance: 7
                });
            }
        });

        // Add named entities with their types
        doc.match('#Person').forEach(match => {
            terms.push({
                term: match.text(),
                type: 'person',
                importance: 9
            });
        });

        doc.match('#Organization').forEach(match => {
            terms.push({
                term: match.text(),
                type: 'organization',
                importance: 8
            });
        });

        doc.match('#Date').forEach(match => {
            terms.push({
                term: match.text(),
                type: 'date',
                importance: 7
            });
        });
        
        // Add named entities
        entities.forEach(entity => {
            terms.push({
                term: entity.value,
                type: entity.type,
                importance: 8
            });
        });
        
        // Get synonyms and related terms using WordNet
        const enrichedTerms = await Promise.all(terms.map(async term => {
            const synsets = await new Promise(resolve => {
                wordnet.lookup(term.term, results => resolve(results));
            });
            
            return {
                ...term,
                synonyms: synsets.map(synset => synset.synonyms).flat(),
                definition: synsets[0]?.definition || ''
            };
        }));
        
            return enrichedTerms;
        } catch (error) {
            console.error('Error in extractKeyTerms:', error);
            throw new Error(`Failed to extract key terms: ${error.message}`);
        }
    }

    async generateQuestions(content, topic, numberOfQuestions = 5) {
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid input: content must be a non-empty string');
        }
        if (!topic || typeof topic !== 'string') {
            throw new Error('Invalid input: topic must be a non-empty string');
        }
        if (typeof numberOfQuestions !== 'number' || numberOfQuestions < 1) {
            throw new Error('Invalid input: numberOfQuestions must be a positive number');
        }

        try {
        const keyTerms = await this.extractKeyTerms(content);
        const contentSentiment = this.analyzer.analyze(content);
        const semanticRelations = await this.nlp.analyzeSemanticRelations(content);
        const contextualPatterns = await this.nlp.findContextualPatterns(content);
        const enrichedTerms = await this.nlp.enrichTermsWithContext(keyTerms);
        const questions = [];

        if (!keyTerms || keyTerms.length === 0) {
            throw new Error('No key terms could be extracted from the content');
        }
        
        // Identify contextual patterns
        const patterns = Object.entries(this.contextualPatterns).reduce((acc, [type, pattern]) => {
            if (pattern.test(content)) acc.push(type);
            return acc;
        }, []);

        for (let i = 0; i < numberOfQuestions && i < keyTerms.length; i++) {
            const termObj = keyTerms[i];
            const term = termObj.term;
            
            // Use contextual patterns to determine question type
            let questionType;
            if (patterns.includes('cause_effect')) {
                questionType = 'analysis';
            } else if (patterns.includes('comparison')) {
                questionType = 'evaluation';
            } else if (patterns.includes('sequence')) {
                questionType = 'application';
            } else if (patterns.includes('problem_solution')) {
                questionType = 'synthesis';
            } else {
                questionType = Object.keys(this.questionTemplates)[i % Object.keys(this.questionTemplates).length];
            }

            const templates = this.questionTemplates[questionType];
            const template = templates[Math.floor(Math.random() * templates.length)];

            // Find related terms based on dependencies
            const relatedTerms = keyTerms.filter(kt => 
                kt.dependencies?.some(dep => 
                    dep.text.toLowerCase().includes(term.toLowerCase()) ||
                    term.toLowerCase().includes(dep.text.toLowerCase())
                )
            );

            let questionText = template;
            if (template.includes('{term1}') && template.includes('{term2}')) {
                const term2 = relatedTerms.length > 0 ? 
                    relatedTerms[0].term : 
                    keyTerms[(i + 1) % keyTerms.length].term;
                questionText = template
                    .replace('{term1}', term)
                    .replace('{term2}', term2);
            } else {
                questionText = template.replace('{term}', term);
            }

            // Calculate difficulty based on multiple factors
            const difficultyScore = (
                termObj.importance * 0.4 +
                (termObj.dependencies?.length || 0) * 0.3 +
                (relatedTerms.length * 0.2) +
                (patterns.length * 0.1)
            );

            questions.push({
                question_text: questionText,
                topic: topic,
                marks: Math.ceil(difficultyScore),
                options: null,
                correct_answer: null,
                difficulty_level: difficultyScore > 7 ? 'hard' : difficultyScore > 5 ? 'medium' : 'easy',
                context: termObj.definition || '',
                sentiment: contentSentiment.score,
                question_type: questionType,
                contextual_patterns: patterns,
                related_concepts: relatedTerms.map(rt => rt.term)
            });
        }



        return questions;
        } catch (error) {
            console.error('Error in generateQuestions:', error);
            throw new Error(`Failed to generate questions: ${error.message}`);
        }
    }

    validateQuestion(question) {
        return (
            question.question_text &&
            question.question_text.length >= 10 &&
            question.topic &&
            question.marks > 0
        );
    }

    async generateAndSaveQuestions(content, examId, topic, numberOfQuestions) {
        const questions = this.generateQuestions(content, topic, numberOfQuestions);
        const validQuestions = questions.filter(q => this.validateQuestion(q));

        return validQuestions.map(q => ({
            ...q,
            exam_id: examId
        }));
    }
}

module.exports = new QuestionGenerator();