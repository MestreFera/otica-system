const fs = require('fs');

async function processJson() {
    // I am generating the script that modifies the N8N flow JSON.
    const inputFile = 'n8n_input.json';
    const outputFile = 'n8n_template_otica.json';

    let raw;
    try {
        raw = fs.readFileSync(inputFile, 'utf-8');
    } catch (e) {
        console.error("Could not read input file. Make sure n8n_input.json exists.");
        process.exit(1);
    }

    let parsed = JSON.parse(raw);

    parsed.nodes.forEach(node => {
        if (node.type === 'n8n-nodes-base.supabase') {
            // Update all supabase nodes to point to 'clients'
            if (node.parameters.tableId && (node.parameters.tableId === 'followup_nerd_otica' || node.parameters.tableId === 'nerd_otica_leads')) {
                node.parameters.tableId = 'clients';
            }

            // Update specific fields based on node name
            if (node.name === 'CreateUser') {
                // The fields mapped for Lead creation
                node.parameters.fieldsUi.fieldValues = [
                    {
                        fieldId: 'unit_id',
                        fieldValue: '{{ $json.unit_id || "COLE_AQUI_O_UUID_DA_UNIDADE" }}'
                    },
                    {
                        fieldId: 'name',
                        fieldValue: '={{ $(\'DadosIniciais\').item.json.contato.nome_cliente }}'
                    },
                    {
                        fieldId: 'phone',
                        fieldValue: '={{ $(\'DadosIniciais\').item.json.contato.telefone_cliente }}'
                    },
                    {
                        fieldId: 'telefone_cliente', // Optional duplication for compatibility
                        fieldValue: '={{ $(\'DadosIniciais\').item.json.contato.telefone_cliente }}'
                    },
                    {
                        fieldId: 'ultima_mensagem',
                        fieldValue: '={{ $(\'DadosIniciais\').item.json.content.idMensagem }}'
                    },
                    {
                        fieldId: 'status_ia',
                        fieldValue: '={{ $json.data }}'
                    },
                    {
                        fieldId: 'status',
                        fieldValue: 'Novo'
                    },
                    {
                        fieldId: 'etapa_fluxo',
                        fieldValue: 'inicio'
                    }
                ];
            }
        }
    });

    // Write the output file
    fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
    console.log(`Generated ${outputFile} successfully.`);
}

processJson();
