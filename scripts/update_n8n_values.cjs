const fs = require('fs');
const file = 'C:/Users/Cris/.gemini/antigravity/brain/bbadc51f-ddb4-470d-b6da-7e1d3307552e/n8n_otica_template.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.nodes.forEach(node => {
    if (node.name === 'CreateUser') {
        node.parameters.fieldsUi.fieldValues.forEach(f => {
            if (f.fieldId === 'unit_id') {
                f.fieldValue = '7777ddc2-c2ae-4614-aadd-5c9792576d7b';
            }
        });
    }
    if (node.credentials && node.credentials.supabaseApi && node.credentials.supabaseApi.name === 'SDR') {
        node.credentials.supabaseApi.name = 'Otica_lima';
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
