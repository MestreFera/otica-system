const fs = require('fs');
const file = 'C:/Users/Cris/.gemini/antigravity/brain/bbadc51f-ddb4-470d-b6da-7e1d3307552e/n8n_otica_template.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

let dadosIniciais = data.nodes.find(n => n.name === 'DadosIniciais');
if (dadosIniciais) {
    dadosIniciais.parameters.fieldsUi.fieldValues.forEach(f => {
        if (f.name === 'contato.telefone_cliente') {
            // Replace remoteJidAlt with sender stripped of @s.whatsapp.net
            f.value = "={{ $json.body.sender.replace('@s.whatsapp.net', '') }}";
        }
    });
}

function updateRemoteJid(nodes) {
    nodes.forEach(node => {
        if (node.parameters && node.parameters.url && node.parameters.url.includes('/messages/sendText')) {
            if (node.parameters.bodyParameters && node.parameters.bodyParameters.parameters) {
                node.parameters.bodyParameters.parameters.forEach(p => {
                    if (p.name === 'number') {
                        // Sometimes it's remoteJid, sometimes number in Evolution API send.
                        // We leave this alone as it uses contato.telefone_cliente which is now cleanly formatted
                        // Wait, if it sends back, it needs the @s.whatsapp.net maybe?
                        // Actually Evolution API /messages/sendText accepts just the digits!
                    }
                });
            }
        }
    });
}
updateRemoteJid(data.nodes);

fs.writeFileSync(file, JSON.stringify(data, null, 2));
