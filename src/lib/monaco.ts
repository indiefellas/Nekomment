import * as monaco from 'monaco-editor';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import { docs } from './docs';

self.MonacoEnvironment = {
    getWorker: function (_: string, label: string) {
        switch (label) {
            case 'css':
                return new cssWorker();
            case 'handlebars':
                return new htmlWorker();
            default:
                return new editorWorker();
        }
    }
};

import('monaco-themes/themes/Blackboard.json').then(data => {
    monaco.editor.defineTheme('blackboard', data);
    monaco.editor.setTheme('blackboard');
    monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{'],
        provideCompletionItems: (modal, pos, token) => {
            console.log(modal, pos, token)
            return {
                suggestions: [
                    {
                        label: 'name',
                        insertText: 'name',
                        documentation: 'The name of the Page.'
                    }
                ]
            }
        }
    })
    monaco.languages.registerHoverProvider('handlebars', {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) {
                return null;
            }

            const lineContent = model.getLineContent(position.lineNumber);

            const handlebarsOnLine = lineContent.match(/({{{?[\w\.\#\ ]+}}}?)/gm);

            let textAtCursor = lineContent.substring(position.column - 10, position.column + 10);
            let tCursor1 = textAtCursor.match(/({{{?[\w\.\#\?]+)/gm);
            let tCursor2 = textAtCursor.match(/([\w\.\#\?]+}}}?)/gm);

            const selectedVal = handlebarsOnLine?.find(x => x.includes(tCursor1?.[0] ?? 'nope')) || handlebarsOnLine?.find(x => x.includes(tCursor2?.[0] ?? 'nope'));
            const range = new monaco.Range(
                position.lineNumber,
                lineContent.indexOf(selectedVal) + 1,
                position.lineNumber,
                (lineContent.indexOf(selectedVal) + selectedVal?.length || 0) + 1
            );

            console.log(handlebarsOnLine, textAtCursor, tCursor1, tCursor2, handlebarsOnLine?.find(x => x.includes(tCursor1?.[0] ?? 'nope')) || handlebarsOnLine?.find(x => x.includes(tCursor2?.[0] ?? 'nope')));

            if (handlebarsOnLine?.find(x => x.includes(tCursor1?.[0] ?? 'nope')) || handlebarsOnLine?.find(x => x.includes(tCursor2?.[0] ?? 'nope'))) {
                let doc = docs.find(d => selectedVal?.includes(d.value))
                console.log(doc);
                return {
                    range: range,
                    contents: [{ value: doc?.description }]
                };
            }

            return null;
        }
    })
})

export default monaco;