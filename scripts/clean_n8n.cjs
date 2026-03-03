const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const unitId = process.argv[4] || 'COLE_AQUI_O_UUID_DA_UNIDADE';

if (!inputFile || !outputFile) {
    console.error('Usage: node clean_n8n.js <input> <output> [unit_id]');
    process.exit(1);
}

const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

// List of nodes to delete: Table creations and deletions!
const dangerousNodes = [
    'Deleta Histórico',
    'Deleta Conteúdo Chats',
    'Deleta Conteúdo Dados Cliente',
    'Deleta Conteúdo Chat_Messages',
    'Cria Tabela Dados Cliente',
    'Cria Tabela Chats',
    'Cria Tabela Chat_Messages',
    'Criar n8n Chat stories'
];

data.nodes = data.nodes.filter(node => !dangerousNodes.includes(node.name));

// We also need to fix the Supabase 'Create a row' to inject the unit_id and the table name 'dados_cliente'.
data.nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.supabase' && node.parameters.operation !== 'executeQuery') {
        const params = node.parameters;

        // Ensure tableId is always string, sometimes n8n puts it in an expression
        if (params.tableId === 'dados_cliente') {
            // We are in a node targeting dados_cliente (create, update, get)
            // If it's the "Create a row" node, we must add unit_id
            if (node.name === 'Create a row') {
                if (params.fieldsUi && params.fieldsUi.fieldValues) {
                    const hasUnitId = params.fieldsUi.fieldValues.some(f => f.fieldId === 'unit_id');
                    if (!hasUnitId) {
                        params.fieldsUi.fieldValues.push({
                            fieldId: 'unit_id',
                            fieldValue: unitId
                        });
                    }
                }
            }
        }
    }
});

// Since the user deleted some nodes, any connections starting or ending at dangerousNodes should be pruned:
const removedIds = data.nodes.filter(node => dangerousNodes.includes(node.name)).map(n => n.name);

// For connections, n8n structures it as connections[nodeName][outputName][outputIndex] = [{node: "targetName", type: "main", index: 0}]
Object.keys(data.connections).forEach(sourceNode => {
    if (dangerousNodes.includes(sourceNode)) {
        delete data.connections[sourceNode];
    } else {
        const outputs = data.connections[sourceNode];
        Object.keys(outputs).forEach(outType => {
            outputs[outType] = outputs[outType].map(connections => {
                return connections.filter(conn => !dangerousNodes.includes(conn.node));
            });
            // If empty, cleanup
            if (outputs[outType].every(c => c.length === 0)) {
                delete outputs[outType];
            }
        });
        if (Object.keys(outputs).length === 0) {
            delete data.connections[sourceNode];
        }
    }
});

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log('Cleaned N8N flow written to', outputFile);
