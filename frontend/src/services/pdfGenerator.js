import { jsPDF } from "jspdf";

export const generarRecibo = (d) => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- ENCABEZADO ---
    doc.setFillColor(30, 64, 175); // Azul oscuro
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("REPAIR-MANAGER PRO", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Soporte Técnico Especializado", 105, 28, { align: "center" });

    // --- CUERPO DEL RECIBO ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 20, 55);
    doc.line(20, 57, 190, 57);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${d.nombre}`, 20, 65);
    doc.text(`Cédula/ID: ${d.cedula || 'N/A'}`, 20, 72);
    doc.text(`Teléfono: ${d.telefono}`, 120, 65);
    doc.text(`Email: ${d.email || 'N/A'}`, 120, 72);

    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL EQUIPO", 20, 85);
    doc.line(20, 87, 190, 87);

    doc.setFont("helvetica", "normal");
    doc.text(`Tipo: ${d.tipo}`, 20, 95);
    doc.text(`Marca: ${d.marca}`, 70, 95);
    doc.text(`Modelo: ${d.modelo}`, 130, 95);
    
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNÓSTICO INICIAL:", 20, 105);
    doc.setFont("helvetica", "normal");
    // SplitTextToSize ayuda a que el texto largo no se salga de la hoja
    const fallaLimpia = doc.splitTextToSize(d.falla, 160);
    doc.text(fallaLimpia, 20, 112);

    // --- COSTO Y ESTADO ---
    doc.setFillColor(245, 247, 250);
    doc.rect(20, 130, 170, 20, 'F');
    doc.setFont("helvetica", "bold");
    doc.text(`PRESUPUESTO ESTIMADO: $${d.costo}`, 30, 142);
    doc.text(`FECHA DE INGRESO: ${fecha} - ${hora}`, 110, 142);

    // --- FIRMAS ---
    doc.line(30, 180, 80, 180);
    doc.text("Firma Cliente", 40, 185);

    doc.line(130, 180, 180, 180);
    doc.text("Técnico Responsable", 135, 185);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento es un comprobante de recepción. No válido como factura legal.", 105, 200, { align: "center" });

    doc.save(`Recibo_${d.nombre.replace(/\s+/g, '_')}.pdf`);
};