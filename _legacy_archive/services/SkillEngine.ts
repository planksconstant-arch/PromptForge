import { MemoryNode, MemoryService } from './MemoryService';

export interface SkillRule {
    trigger: string;
    action: string;
    originalText: string;
    type: 'text' | 'action';
    actionDetails?: {
        verb: 'click' | 'type' | 'wait';
        target: string;
        value?: string;
    };
}

export const SkillEngine = {
    parse(input: string): SkillRule | null {
        // 1. Check for Action Commands
        // "When [trigger], click [target]"
        // "When [trigger], type [value] into [target]"

        const clickRegex = /^(?:When|If)\s+(.+?),\s*click\s+(.+)$/i;
        const typeRegex = /^(?:When|If)\s+(.+?),\s*type\s+['"](.+?)['"]\s+(?:into|in)\s+(.+)$/i;

        const clickMatch = input.match(clickRegex);
        if (clickMatch) {
            return {
                trigger: clickMatch[1].trim(),
                action: `Click ${clickMatch[2]}`,
                originalText: input,
                type: 'action',
                actionDetails: {
                    verb: 'click',
                    target: clickMatch[2].trim()
                }
            };
        }

        const typeMatch = input.match(typeRegex);
        if (typeMatch) {
            return {
                trigger: typeMatch[1].trim(),
                action: `Type "${typeMatch[2]}" into ${typeMatch[3]}`,
                originalText: input,
                type: 'action',
                actionDetails: {
                    verb: 'type',
                    value: typeMatch[2].trim(),
                    target: typeMatch[3].trim()
                }
            };
        }

        // 2. Fallback to Text Rule
        const regex = /^(?:When|If)\s+(.+?),\s*(?:then\s+)?(.+)$/i;
        const match = input.match(regex);

        if (match) {
            return {
                trigger: match[1].trim(),
                action: match[2].trim(),
                originalText: input,
                type: 'text'
            };
        }

        // 3. General Rule
        return {
            trigger: 'always',
            action: input,
            originalText: input,
            type: 'text'
        };
    },

    async learnSkill(input: string): Promise<MemoryNode> {
        const rule = this.parse(input);

        let content = rule?.originalText || input;
        let type: 'rule' | 'action' = 'rule';

        if (rule?.type === 'action') {
            type = 'action' as any; // We might need to update MemoryNode type definition or just use 'rule' with metadata
            content = `[ACTION] ${content}`;
        } else if (rule?.trigger !== 'always') {
            content = `WHEN ${rule?.trigger} THEN ${rule?.action}`;
        }

        return await MemoryService.addMemory({
            type: 'rule', // Keep as 'rule' for now to avoid breaking types, but content distinguishes it
            content: content,
            weight: 0.7
        });
    }
};
