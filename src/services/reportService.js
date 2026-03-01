import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const reportService = {
    // ─── PDF: Client Prescription ───
    generatePrescriptionPDF(client, unitName = 'ÓticaSystem') {
        const doc = new jsPDF();
        const w = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(10, 15, 30);
        doc.rect(0, 0, w, 40, 'F');
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ÓticaSystem', 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text(unitName, 14, 28);
        doc.setTextColor(150, 150, 150);
        doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, w - 14, 28, { align: 'right' });

        // Patient info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Prescrição Óptica', 14, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const info = [
            ['Paciente', client.client_name || client.name || '—'],
            ['Telefone', client.phone || '—'],
            ['Médico', client.doctor_name || '—'],
            ['Data do Exame', client.exam_date ? new Date(client.exam_date).toLocaleDateString('pt-BR') : '—'],
        ];
        let y = 65;
        info.forEach(([label, val]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 14, y);
            doc.setFont('helvetica', 'normal');
            doc.text(val, 55, y);
            y += 8;
        });

        // Prescription table
        autoTable(doc, {
            startY: y + 5,
            head: [['Olho', 'Esférico', 'Cilíndrico', 'Eixo', 'DNP', 'Adição']],
            body: [
                ['OD (Direito)', client.od_esf || '—', client.od_cil || '—', client.od_eixo || '—', client.od_dnp || '—', client.od_add || '—'],
                ['OE (Esquerdo)', client.oe_esf || '—', client.oe_cil || '—', client.oe_eixo || '—', client.oe_dnp || '—', client.oe_add || '—'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [10, 15, 30], textColor: [0, 212, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 5 },
        });

        // Order info
        const tableEndY = doc.lastAutoTable.finalY + 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Dados do Pedido', 14, tableEndY);

        const orderInfo = [
            ['Tipo de Lente', client.lens_type || '—'],
            ['Material', client.lens_material || '—'],
            ['Armação', [client.frame_brand, client.frame_model, client.frame_color].filter(Boolean).join(' — ') || '—'],
            ['Laboratório', client.lab || '—'],
            ['Valor Total', client.total_value ? `R$ ${Number(client.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'],
        ];
        let oy = tableEndY + 10;
        doc.setFontSize(10);
        orderInfo.forEach(([label, val]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 14, oy);
            doc.setFont('helvetica', 'normal');
            doc.text(val, 60, oy);
            oy += 7;
        });

        // Footer
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(200);
        doc.line(14, pageH - 25, w - 14, pageH - 25);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${unitName} — ÓticaSystem`, 14, pageH - 18);
        doc.text('Documento gerado automaticamente', w - 14, pageH - 18, { align: 'right' });

        doc.save(`prescricao_${(client.client_name || client.name || 'cliente').replace(/\s+/g, '_')}.pdf`);
    },

    // ─── CSV: Clients export ───
    exportClientsCSV(clients, filename = 'clientes.csv') {
        const headers = ['Nome', 'Telefone', 'Status', 'Lente', 'Valor Total', 'Valor Pago', 'Médico', 'Criado em'];
        const rows = clients.map(c => [
            c.client_name || c.name, c.phone, c.status, c.lens_type,
            c.total_value, c.paid_value, c.doctor_name,
            c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '',
        ]);
        this._downloadCSV([headers, ...rows], filename);
    },

    // ─── CSV: Master report ───
    exportMasterReportCSV(units, filename = 'relatorio_master.csv') {
        const headers = ['Unidade', 'Cidade', 'Status', 'Clientes', 'Faturamento', 'Recebido', 'Pendente'];
        const rows = units.map(u => [
            u.name, u.city, u.active ? 'Ativa' : 'Inativa',
            u.total_clients, u.total_revenue, u.total_paid,
            Number(u.total_revenue || 0) - Number(u.total_paid || 0),
        ]);
        this._downloadCSV([headers, ...rows], filename);
    },

    _downloadCSV(rows, filename) {
        const bom = '\uFEFF';
        const csv = bom + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    },

    // ─── PDF: Master monthly report ───
    generateMasterReportPDF(units, month) {
        const doc = new jsPDF('landscape');
        const w = doc.internal.pageSize.getWidth();

        doc.setFillColor(10, 15, 30);
        doc.rect(0, 0, w, 30, 'F');
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ÓticaSystem — Relatório Mensal', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.text(month || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), w - 14, 20, { align: 'right' });

        autoTable(doc, {
            startY: 40,
            head: [['Unidade', 'Cidade', 'Clientes', 'Faturamento', 'Recebido', 'Pendente', 'Status']],
            body: units.map(u => [
                u.name, u.city, u.total_clients || 0,
                `R$ ${Number(u.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${Number(u.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${(Number(u.total_revenue || 0) - Number(u.total_paid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                u.active ? 'Ativa' : 'Inativa',
            ]),
            theme: 'grid',
            headStyles: { fillColor: [10, 15, 30], textColor: [0, 212, 255] },
            styles: { fontSize: 9 },
        });

        doc.save(`relatorio_master_${new Date().toISOString().slice(0, 7)}.pdf`);
    },
};
