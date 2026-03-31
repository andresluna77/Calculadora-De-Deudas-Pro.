let chartInstance = null;
window.onload = recalcular;

function recalcular() {
    const datos = JSON.parse(localStorage.getItem("datosDeudas"));
    if (!datos) return;

    let sBase = Number(datos.sueldo.replace(/\./g, "") || 0);
    let abonoManual = Number((datos.abonoVoluntario || "0").replace(/\./g, "") || 0);
    let esQuincenal = datos.tipoIngreso === "quincenal";
    let sMensual = esQuincenal ? sBase * 2 : sBase;
    let gFijosM = datos.gastos.reduce((a, b) => a + Number(b.valor.replace(/\./g, "") || 0), 0);

    let deudasSim = datos.deudas.filter(d => !d.estado).map(d => ({
        nombre: d.nombre, monto: Number(d.monto.replace(/\./g, "") || 0), pagoMin: Number(d.pago.replace(/\./g, "") || 0)
    }));

    let tDeudaInicial = deudasSim.reduce((a, b) => a + b.monto, 0);
    let tPagosM = deudasSim.reduce((a, b) => a + b.pagoMin, 0);
    let disponibleM = sMensual - (tPagosM + gFijosM);
    let porcentaje = sMensual > 0 ? ((tPagosM + gFijosM) / sMensual) * 100 : 0;

    document.getElementById("kpiDisp").innerText = "$" + disponibleM.toLocaleString();
    document.getElementById("kpiDeuda").innerText = "$" + tDeudaInicial.toLocaleString();
    document.getElementById("kpiPorc").innerText = porcentaje.toFixed(0) + "%";
    lanzarConsejos(porcentaje, abonoManual, disponibleM);

    let metodo = document.querySelector('input[name="metodo"]:checked').value;
    if (metodo === "snowball") deudasSim.sort((a,b) => a.monto - b.monto);

    let factor = esQuincenal ? 2 : 1;
    let textoCiclo = esQuincenal ? "Quincena" : "Mes";
    let labels = ["Inicio"], dataD = [tDeudaInicial], paso = 1;
    let tablaHtml = `<thead><tr><th>${textoCiclo}</th><th>Deuda</th><th>Pago</th><th>Saldo</th></tr></thead><tbody>`;
    let saldoSimulado = tDeudaInicial;

    while (saldoSimulado > 0 && paso <= 240) {
        let extraPaso = abonoManual / factor;
        for(let d of deudasSim) {
            if(d.monto > 0) {
                let pagoPaso = Math.min(d.monto, (d.pagoMin / factor) + extraPaso);
                d.monto -= pagoPaso;
                extraPaso = 0;
                saldoSimulado = deudasSim.reduce((a,b)=>a+b.monto, 0);
                tablaHtml += `<tr><td>${paso}</td><td>${d.nombre}</td><td>$${pagoPaso.toLocaleString()}</td><td>$${saldoSimulado.toLocaleString()}</td></tr>`;
                break;
            }
        }
        labels.push(textoCiclo[0] + paso); dataD.push(saldoSimulado);
        paso++;
        if (saldoSimulado <= 0) break;
    }

    document.getElementById("tablaAmortizacion").innerHTML = tablaHtml + "</tbody>";
    let mesesFin = esQuincenal ? Math.ceil((paso-1)/2) : (paso-1);
    document.getElementById("resumenLibertad").innerText = `¡Libre en ${mesesFin} meses (${paso-1} ${textoCiclo.toLowerCase()}s)!`;

    const ctx = document.getElementById('graficoFinanciero').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Saldo', data: dataD, borderColor: '#dc3545', fill: true, backgroundColor: 'rgba(220,53,69,0.1)', tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function lanzarConsejos(p, abono, disp) {
    let div = document.getElementById("alertas");
    if (abono > disp) div.innerHTML = `<div class="alerta alerta-roja">⚠️ <strong>Aviso:</strong> El abono extra ($${abono.toLocaleString()}) supera tu disponible mensual.</div>`;
    else div.innerHTML = `<div class="alerta alerta-verde">✅ <strong>Plan:</strong> Abonas $${abono.toLocaleString()} extra. Te quedan $${(disp-abono).toLocaleString()} libres.</div>`;
}

function exportarPDF() {
    const elemento = document.getElementById("contenido-pdf");
    const opciones = {
        margin: 10,
        filename: 'Plan_Financiero_Andres.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // Ocultar botones para el PDF
    document.querySelectorAll("button, .opciones-no-pdf").forEach(el => el.style.visibility = "hidden");
    
    html2pdf().set(opciones).from(elemento).save().then(() => {
        document.querySelectorAll("button, .opciones-no-pdf").forEach(el => el.style.visibility = "visible");
    });
}