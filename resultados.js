let chartInstance = null;
window.onload = recalcular;

function recalcular() {
    let datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let sBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let sMensual = datos.tipoIngreso === "quincenal" ? sBase * 2 : sBase;
    let deudas = datos.deudas.filter(d => !d.estado).map(d => ({ nombre: d.nombre, monto: Number(d.monto.replace(/\./g, "") || 0), pago: Number(d.pago.replace(/\./g, "") || 0) }));
    
    let totalD = deudas.reduce((a, b) => a + b.monto, 0);
    let pagosM = deudas.reduce((a, b) => a + b.pago, 0);
    let gFijos = datos.gastos.reduce((a, b) => a + Number(b.valor.replace(/\./g, "") || 0), 0);

    let disp = sMensual - (pagosM + gFijos);
    let ahorro = disp > 0 ? disp * 0.20 : 0;
    let extra = disp - ahorro;
    let porc = (sMensual > 0) ? ((pagosM + gFijos) / sMensual) * 100 : 0;

    document.getElementById("kpiDisponible").innerText = "$" + disp.toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + totalD.toLocaleString();
    document.getElementById("kpiPorcentaje").innerText = porc.toFixed(0) + "%";

    // Lógica de Consejos
    let msg = porc > 70 ? "🚨 Riesgo alto. Consejo: ¡Cierra las tarjetas de crédito ya!" : "✅ Estabilidad. Consejo: Mantén el ahorro del 20%.";
    document.getElementById("resultado").innerHTML = `<div class='kpi'>${msg}<br>Abono extra: $${extra.toLocaleString()}</div>`;

    // Gráfico
    let labels = [], dataD = [], dataA = [], dC = totalD, aA = 0, mes = 1;
    while (dC > 0 && extra > 0 && mes <= 48) { dC -= extra; aA += ahorro; labels.push("M" + mes); dataD.push(Math.max(dC, 0)); dataA.push(aA); mes++; }

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById("graficoFinanciero"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Deuda', data: dataD, borderColor: 'red' }, { label: 'Ahorro', data: dataA, borderColor: 'green' }] }
    });
}

function generarPDF() {
    const el = document.getElementById("reporte");
    html2pdf().set({ margin: 10, filename: 'Reporte.pdf', jsPDF: { orientation: 'landscape' } }).from(el).save();
}