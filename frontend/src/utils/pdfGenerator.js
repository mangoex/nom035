import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize fonts
if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

/**
 * Generates the Official NOM-035 Report PDF
 * @param {Object} stats - The aggregated statistics from backend
 * @param {Object} company - The company information
 * @param {Object} user - The authenticated user (consultant or admin)
 */
export const generateNom035Report = (stats, company, user) => {
  if (!company || !stats) {
    alert("Faltan datos para generar el reporte.");
    return;
  }

  const currentDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isGuiaIII = company.employee_count > 50;
  const guideName = isGuiaIII ? "Guía de Referencia III" : "Guía de Referencia II";
  
  // Format data
  const categoryAverages = stats.category_averages || {};
  const categoryRisks = stats.category_risks || {};
  const domainAverages = stats.domain_averages || {};
  const domainRisks = stats.domain_risks || {};
  const deptAverages = stats.department_averages || {};
  const deptRisks = stats.department_risks || {};

  const getRiskColor = (risk) => {
    switch(risk) {
      case "Nulo": return "#4ade80"; // green
      case "Bajo": return "#2dd4bf"; // teal
      case "Medio": return "#fbbf24"; // yellow
      case "Alto": return "#f97316"; // orange
      case "Muy Alto": return "#ef4444"; // red
      default: return "#94a3b8"; // gray
    }
  };

  // Build Categories Table
  const categoryTableBody = [
    [
      { text: "Categoría", style: "tableHeader" },
      { text: "Puntaje Promedio", style: "tableHeader", alignment: "center" },
      { text: "Nivel de Riesgo", style: "tableHeader", alignment: "center" }
    ]
  ];
  Object.keys(categoryAverages).forEach(cat => {
    categoryTableBody.push([
      cat,
      { text: categoryAverages[cat].toString(), alignment: "center" },
      { text: categoryRisks[cat], alignment: "center", color: getRiskColor(categoryRisks[cat]), bold: true }
    ]);
  });

  // Build Domains Table
  const domainTableBody = [
    [
      { text: "Dominio", style: "tableHeader" },
      { text: "Puntaje Promedio", style: "tableHeader", alignment: "center" },
      { text: "Nivel de Riesgo", style: "tableHeader", alignment: "center" }
    ]
  ];
  Object.keys(domainAverages).forEach(dom => {
    domainTableBody.push([
      dom,
      { text: domainAverages[dom].toString(), alignment: "center" },
      { text: domainRisks[dom], alignment: "center", color: getRiskColor(domainRisks[dom]), bold: true }
    ]);
  });

  // Build Departments Table
  const deptTableBody = [
    [
      { text: "Departamento/Área", style: "tableHeader" },
      { text: "Puntaje Promedio", style: "tableHeader", alignment: "center" },
      { text: "Nivel de Riesgo Global", style: "tableHeader", alignment: "center" }
    ]
  ];
  Object.keys(deptAverages).forEach(dept => {
    deptTableBody.push([
      dept,
      { text: deptAverages[dept].toString(), alignment: "center" },
      { text: deptRisks[dept], alignment: "center", color: getRiskColor(deptRisks[dept]), bold: true }
    ]);
  });
  if (Object.keys(deptAverages).length === 0) {
    deptTableBody.push([{ text: "No hay datos desglosados por departamento aún.", colSpan: 3, alignment: "center", color: "gray" }, {}, {}]);
  }

  // Identify Critical Domains for Conclusions
  const criticalDomains = Object.keys(domainRisks).filter(dom => domainRisks[dom] === "Alto" || domainRisks[dom] === "Muy Alto");
  let conclusionsText = "El análisis de los resultados muestra que la mayoría de los factores psicosociales se encuentran en niveles controlados.";
  if (criticalDomains.length > 0) {
    conclusionsText = `Se han identificado áreas de oportunidad críticas en los siguientes dominios: ${criticalDomains.join(", ")}. Estos factores organizacionales están impactando negativamente el clima laboral y, si no se controlan mediante un plan de acción, podrían derivar en afectaciones a la salud laboral del personal (estrés crónico, ansiedad, burnout) y un potencial incremento en la siniestralidad o prima de riesgo ante el IMSS.`;
  }

  // Define Document Definition
  const docDefinition = {
    content: [
      { text: "INFORME TÉCNICO DE EVALUACIÓN DE FACTORES DE RIESGO PSICOSOCIAL Y ENTORNO ORGANIZACIONAL", style: "mainTitle" },
      { text: "Cumplimiento del Numeral 7.7 de la Norma Oficial Mexicana NOM-035-STPS-2018\n\n", style: "subTitle" },

      { text: "A) DATOS DEL CENTRO DE TRABAJO VERIFICADO", style: "sectionTitle" },
      {
        ul: [
          `Razón Social: ${company.name}`,
          `RFC: ${company.rfc}`,
          `Domicilio Completo: ${company.address || "No especificado"}`,
          `Teléfono: ${company.phone || "No especificado"}`,
          `Actividad Económica Principal: ${company.main_activity || company.sector || "No especificada"}`,
          `Población Laboral Total del Centro de Trabajo: ${company.employee_count} trabajadores`
        ],
        style: "listStyle"
      },

      { text: "\nB) OBJETIVO DEL INFORME", style: "sectionTitle" },
      { text: "El presente informe técnico tiene por objeto principal identificar, analizar y prevenir los factores de riesgo psicosocial, así como evaluar el entorno organizacional para fomentar un ambiente de trabajo favorable en este centro laboral, dando estricto cumplimiento a las disposiciones legales y técnicas establecidas en la Norma Oficial Mexicana NOM-035-STPS-2018.", style: "paragraph" },

      { text: "\nC) PRINCIPALES ACTIVIDADES REALIZADAS EN EL CENTRO DE TRABAJO", style: "sectionTitle" },
      { text: `El centro de trabajo está enfocado principalmente en actividades correspondientes al sector "${company.sector || "General"}". Las operaciones cotidianas involucran la interacción de personal administrativo y operativo para el cumplimiento de los objetivos organizacionales de ${company.name}, exponiendo a los trabajadores a diversas cargas físicas, mentales y responsabilidades inherentes a su puesto.`, style: "paragraph" },

      { text: "\nD) MÉTODO UTILIZADO CONFORME AL NUMERAL 7.4", style: "sectionTitle" },
      { text: `Para la presente evaluación, considerando la plantilla total de trabajadores, se aplicó la ${guideName} de la NOM-035-STPS-2018 de forma confidencial. Asimismo, se utilizó la Guía de Referencia I para la identificación de trabajadores que fueron sujetos a Acontecimientos Traumáticos Severos (ATS).\n\nEl levantamiento se realizó a través de una plataforma digital encriptada, asegurando en todo momento la privacidad, confidencialidad de las respuestas y evitando represalias, cumpliendo con los protocolos de sensibilización.`, style: "paragraph" },

      { text: "\nE) RESULTADOS OBTENIDOS", style: "sectionTitle" },
      { text: "A continuación, se presentan los resultados cuantitativos consolidados de las encuestas aplicadas, referenciando los anexos correspondientes.", style: "paragraph" },
      
      { text: "Nivel de Riesgo Global", style: "tableTitle" },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [{ text: "Puntaje Final Global", style: "tableHeader", alignment: "center" }, { text: "Clasificación de Riesgo", style: "tableHeader", alignment: "center" }],
            [
              { text: stats.global_score_average?.toString() || "0", alignment: "center", margin: [0, 5, 0, 5] },
              { text: stats.global_score_risk || "Nulo", alignment: "center", bold: true, color: getRiskColor(stats.global_score_risk), margin: [0, 5, 0, 5] }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: "\nDesglose de Resultados por Categoría", style: "tableTitle" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: categoryTableBody
        },
        layout: 'lightHorizontalLines'
      },

      { text: "\nDesglose de Resultados por Dominio", style: "tableTitle" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: domainTableBody
        },
        layout: 'lightHorizontalLines'
      },

      { text: "\nDesglose de Resultados por Áreas/Departamentos", style: "tableTitle" },
      { text: "Este desglose permite identificar los focos rojos y priorizar las acciones de intervención. Se hace referencia al 'Anexo A: Base de Datos de Cuestionarios' para su consulta detallada.", style: "paragraph" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: deptTableBody
        },
        layout: 'lightHorizontalLines'
      },

      { text: "\nIdentificación de Acontecimientos Traumáticos Severos (ATS)", style: "tableTitle" },
      { text: `Derivado de la aplicación de la Guía de Referencia I, se reportan cuantitativamente ${stats.requires_clinical_referral_count || 0} trabajador(es) con diagnóstico positivo a ATS que requieren valoración clínica. El registro de identidad se encuentra resguardado confidencialmente en el 'Anexo B: Registro de Casos de Canalización'.`, style: "paragraph" },

      { text: "\nF) CONCLUSIONES", style: "sectionTitle" },
      { text: conclusionsText, style: "paragraph" },

      { text: "\nG) RECOMENDACIONES Y ACCIONES DE INTERVENCIÓN", style: "sectionTitle" },
      { text: "Con base en los resultados, se propone el siguiente Programa de Intervención (Numeral 8.4) estructurado en tres niveles:", style: "paragraph" },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*"],
          body: [
            [{ text: "Nivel de Control", style: "tableHeader" }, { text: "Descripción", style: "tableHeader" }, { text: "Acciones Sugeridas", style: "tableHeader" }],
            [
              { text: "Primer Nivel\n(Organizacional)", bold: true }, 
              "Se enfoca en las políticas y la organización del trabajo.", 
              "Revisar y actualizar la Política de Prevención de Riesgos Psicosociales. Optimizar cargas de trabajo y jornadas laborales."
            ],
            [
              { text: "Segundo Nivel\n(Grupal)", bold: true }, 
              "Se enfoca en grupos de trabajo, liderazgo y comunicación.", 
              "Implementar capacitaciones en liderazgo positivo y comunicación no violenta en las áreas con Riesgo Alto."
            ],
            [
              { text: "Tercer Nivel\n(Individual)", bold: true }, 
              "Se enfoca en la atención de trabajadores afectados.", 
              "Canalizar a la institución de seguridad social o servicio médico privado a los casos positivos identificados con ATS."
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: "\nH) DATOS DEL RESPONSABLE DE LA EVALUACIÓN", style: "sectionTitle" },
      {
        ul: [
          `Nombre Completo: ${user.name}`,
          `Puesto/Cargo: ${user.role === 'consultor' ? 'Consultor Externo Especialista' : 'Responsable Interno / Administrador'}`,
          `Cédula Profesional: ${user.cedula_profesional || "No proporcionada"}`
        ],
        style: "listStyle"
      },
      { text: "\n\n___________________________________________________", alignment: "center", margin: [0, 30, 0, 5] },
      { text: `Firma autógrafa del responsable\n\nFecha de Emisión del Reporte: ${currentDate}`, alignment: "center", style: "paragraph" },

      { text: "\n\nSECCIÓN DE ANEXOS DE RESPALDO (EVIDENCIA DOCUMENTAL OBLIGATORIA)", style: "sectionTitle", pageBreak: "before" },
      {
        ul: [
          "Anexo A: Base de datos completa con puntajes brutos por reactivo, categoría y dominio. Este documento físico/digital se mantiene en resguardo por un período mínimo de un año.",
          "Anexo B: Oficios de canalización médica (IMSS o institución privada) correspondientes a los trabajadores con ATS positivo.",
          "Anexo C: Evidencias de difusión de la información (Política de Prevención firmada por los trabajadores, trípticos y evidencia del mecanismo confidencial de quejas)."
        ],
        style: "listStyle"
      }
    ],
    styles: {
      mainTitle: {
        fontSize: 16,
        bold: true,
        alignment: "center",
        marginBottom: 5,
        color: "#1e293b"
      },
      subTitle: {
        fontSize: 11,
        alignment: "center",
        italics: true,
        color: "#64748b"
      },
      sectionTitle: {
        fontSize: 13,
        bold: true,
        marginTop: 15,
        marginBottom: 8,
        color: "#334155",
        decoration: "underline"
      },
      paragraph: {
        fontSize: 11,
        lineHeight: 1.5,
        marginBottom: 8,
        alignment: "justify",
        color: "#334155"
      },
      listStyle: {
        fontSize: 11,
        lineHeight: 1.5,
        marginBottom: 10,
        color: "#334155"
      },
      tableTitle: {
        fontSize: 12,
        bold: true,
        marginTop: 10,
        marginBottom: 5,
        color: "#475569"
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: "#1e293b",
        fillColor: "#f1f5f9"
      }
    },
    defaultStyle: {
      font: "Roboto"
    }
  };

  // Generate and download
  pdfMake.createPdf(docDefinition).download(`Reporte_NOM035_${company.rfc}_${currentDate.replace(/\s+/g, "_")}.pdf`);
};
