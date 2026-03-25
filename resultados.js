let chartInstance = null;
window.onload = recalcular;

function recalcular() {
    let datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let sueldoBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let sueldoMensual = datos.tipoIngreso === "quincenal" ? sueldoBase * 2 : sueldoBase;

    let deudas = datos.deudas.filter(d => !d.estado).map(d => ({
        nombre: d.nombre, monto: Number(d.monto.replace(/\./g, "") || 0), pago: Number(d.pago.replace(/\./g, "") || 0)
    }));

    let totalDeuda = deudas.reduce((acc, d) => acc + d.monto, 0);
    let pagosMin = deudas.reduce((acc, d) => acc + d.pago, 0);
    let gastosFijos = datos.gastos.reduce((acc, g) => acc + Number(g.valor.replace(/\./g, "") || 0), 0);

    let disponible = sueldoMensual - (pagosMin + gastosFijos);
    let ahorro = disponible > 0 ? disponible * 0.20 : 0;
    let abonoExtra = disponible - ahorro;
    let porcentaje = (sueldoMensual > 0) ? ((pagosMin + gastosFijos) / sueldoMensual) * 100 : 0;

    document.getElementById("kpiDisponible").innerText = "$" + disponible.toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + totalDeuda.toLocaleString();
    document.getElementById("kpiPorcentaje").innerText = porcentaje.toFixed(0) + "%";

    // Consejos
    if (porcentaje > 70) {
        document.getElementById("mensajeExplicativo").innerHTML = "⚠️ Estás en zona de riesgo.";
        document.getElementById("consejoFinanciero").innerHTML = "📢 Consejo: ¡No uses tarjetas de crédito este mes! Prioriza la deuda más pequeña.";
    } else {
        document.getElementById("mensajeExplicativo").innerHTML = "✅ Tienes buena capacidad de pago.";
        document.getElementById("consejoFinanciero").innerHTML = "📢 Consejo: Mantén el ahorro del 20% para emergencias técnicas o personales.";
    }

    // Simulación
    let metodo = document.querySelector('input[name="metodo"]:checked').value;
    if (metodo === "snowball") deudas.sort((a, b) => a.monto - b.monto);

    let labels = [], dataD = [], dataA = [], dC = totalDeuda, aA = 0, mes = 1;
    while (dC > 0 && abonoExtra > 0 && mes <= 48) {
        dC -= abonoExtra; aA += ahorro;
        labels.push("Mes " + mes); dataD.push(Math.max(dC, 0)); dataA.push(aA); mes++;
    }

    document.getElementById("resultado").innerHTML = `<p>Abono sugerido: <b>$${abonoExtra.toLocaleString()}</b>. Libre en <b>${mes-1} meses</b>.</p>`;

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById("graficoFinanciero"), {
        type: 'line',
        data: { labels, datasets: [
            { label: 'Deuda', data: dataD, borderColor: '#dc3545' },
            { label: 'Ahorro', data: dataA, borderColor: '#28a745' }
        ]}
    });
}

function generarPDF() {
    const el = document.getElementById("reporte");
    document.getElementById("btnPDF").style.display = "none";
    html2pdf().set({ margin: 10, filename: 'Reporte.pdf', html2canvas: { scale: 2 }, jsPDF: { orientation: 'landscape' } })
    .from(el).save().then(() => document.getElementById("btnPDF").style.display = "inline-block");
}