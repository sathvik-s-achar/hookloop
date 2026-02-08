// dashboard/src/JsonView.jsx
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

const JsonView = ({ data }) => {
  return (
    <div style={{ borderRadius: '6px', overflow: 'hidden', fontSize: '0.85rem' }}>
      <SyntaxHighlighter 
        language="json" 
        style={atomOneDark}
        customStyle={{ padding: '15px', margin: 0, background: '#0d1117' }}
        wrapLongLines={true}
      >
        {JSON.stringify(data, null, 2)}
      </SyntaxHighlighter>
    </div>
  );
};

export default JsonView;