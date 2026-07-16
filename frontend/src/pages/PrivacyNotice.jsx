import React from "react";
import { ArrowLeft, Building, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const contactEmail = "contacto@humanio.digital";

export default function PrivacyNotice() {
  return (
    <main className="privacy-page">
      <div className="privacy-theme-toggle">
        <ThemeToggle />
      </div>

      <article className="glass-card privacy-notice animate-slide-up">
        <header className="privacy-header">
          <div className="privacy-icon" aria-hidden="true">
            <ShieldCheck size={32} />
          </div>
          <p className="privacy-eyebrow">Plataforma SaaS de Evaluación y Diagnóstico</p>
          <h1>Aviso de Privacidad Integral</h1>
          <p className="privacy-subtitle">NOM-035-STPS-2018</p>
          <p className="privacy-update">Última actualización: 9 de julio de 2026</p>
        </header>

        <div className="privacy-content">
          <p>
            El presente Aviso de Privacidad se redacta en cumplimiento con la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y los lineamientos de la Norma
            Oficial Mexicana NOM-035-STPS-2018 (en adelante, la “NOM-035”).
          </p>
          <p>
            Para facilitar su lectura, utilizaremos un lenguaje claro, sencillo y formal, garantizando que tanto
            las empresas, consultores y trabajadores comprendan perfectamente cómo se protegen sus datos en nuestra plataforma
            web: <a href="https://paperclip-nom035-app.yroec7.easypanel.host/">https://paperclip-nom035-app.yroec7.easypanel.host/</a> (en adelante, la “Plataforma”).
          </p>

          <section>
            <h2>1. ¿Quién es el Responsable de sus datos?</h2>
            <p>
              El titular y operador de la Plataforma es Miguel Ángel González Espino (en adelante, el “Operador de
              la Plataforma”), con domicilio para oír y recibir notificaciones en Rafael Buelna 575 Centro Oriente,
              Culiacán, Sinaloa, México, C.P. 80000, y correo electrónico de contacto <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </section>

          <section>
            <h2>2. La Distinción Legal Clave: ¿Cuál es nuestro rol en el tratamiento de sus datos?</h2>
            <p>Bajo la legislación mexicana de protección de datos, nuestra Plataforma opera bajo dos esquemas distintos según el tipo de usuario:</p>
            <ul>
              <li><strong>Como “Responsable” (para Clientes y Consultores):</strong> Nosotros decidimos y gestionamos directamente los datos de las empresas, patrones y consultores independientes que se registran, contratan y pagan por el uso del SaaS.</li>
              <li><strong>Como “Encargado” (para los Trabajadores/Colaboradores de nuestros clientes):</strong> El patrón (la empresa cliente o el consultor que la representa) es el único “Responsable” del cumplimiento de la NOM-035 y de los datos de sus empleados. Nosotros únicamente actuamos como un “Encargado” tecnológico que procesa, almacena y genera reportes de las encuestas bajo las instrucciones del patrón. El patrón es el obligado a contar con su propio Aviso de Privacidad interno para sus trabajadores.</li>
            </ul>
          </section>

          <section>
            <h2>3. Datos personales que recabamos y tratamos</h2>
            <h3>A. De nuestros Clientes (Empresas, Administradores y Consultores)</h3>
            <p>Para que puedan registrarse, utilizar el software y gestionar sus centros de trabajo, recabamos de forma directa:</p>
            <ul>
              <li>Nombre completo del administrador o consultor.</li>
              <li>Nombre o Razón Social de la Empresa.</li>
              <li>Registro Federal de Contribuyentes (RFC) y domicilio fiscal (para facturación).</li>
              <li>Correo electrónico y número de teléfono de contacto.</li>
              <li>Datos de pago (los cuales son procesados de forma encriptada y segura a través de pasarelas de pago de terceros; nosotros no almacenamos números de tarjetas de crédito/débito en nuestros servidores).</li>
            </ul>
            <h3>B. De los Trabajadores/Colaboradores (que responden las encuestas)</h3>
            <p>Para aplicar los cuestionarios de la NOM-035 (Guías de Referencia I, II y/o III) recabamos:</p>
            <ul>
              <li><strong>Datos de Identificación (Opcional/Según configuración del patrón):</strong> Nombre completo o correo electrónico o, en su defecto, un ID/Token anónimo si el patrón decide aplicar la encuesta de forma estrictamente confidencial.</li>
              <li><strong>Datos de Áreas de Trabajo:</strong> Centro de trabajo, departamento, puesto, área laboral, jornada de trabajo y antigüedad.</li>
              <li>
                <strong>Datos Personales Sensibles:</strong> Respuestas a los cuestionarios de la NOM-035 que evalúan:
                <ul>
                  <li>Acontecimientos Traumáticos Severos (Guía I).</li>
                  <li>Factores de Riesgo Psicosocial (Guía II o III).</li>
                  <li>Evaluación del Entorno Organizacional (Guía III).</li>
                </ul>
              </li>
            </ul>
            <p className="privacy-callout"><strong>Nota Legal:</strong> Estos datos son considerados sensibles según la LFPDPPP, ya que revelan aspectos del estado emocional, de salud mental y de la vida laboral del trabajador derivados de eventos traumáticos o violencia laboral. Se tratan bajo las más estrictas medidas de seguridad técnica.</p>
          </section>

          <section>
            <h2>4. ¿Para qué utilizamos estos datos? (Finalidades del tratamiento)</h2>
            <h3>Finalidades Primarias para Clientes (Empresas/Consultores)</h3>
            <ul>
              <li>Crear y gestionar su cuenta de acceso a la Plataforma.</li>
              <li>Procesar pagos y emitir las facturas fiscales correspondientes.</li>
              <li>Brindar soporte técnico y atención a clientes.</li>
              <li>Permitirles configurar sus centros de trabajo y dar seguimiento al avance de las encuestas.</li>
            </ul>
            <h3>Finalidades Primarias para Trabajadores/Colaboradores (en nuestro rol de Encargado)</h3>
            <ul>
              <li>Habilitar el acceso digital a los cuestionarios oficiales de la NOM-035 de la STPS.</li>
              <li>Procesar las respuestas para generar los diagnósticos de riesgo psicosocial correspondientes a cada centro de trabajo.</li>
              <li>Generar reportes estadísticos, gráficos y bases de datos agregadas para que el Patrón cumpla con las auditorías de la STPS.</li>
              <li>Identificar de manera automatizada a aquellos trabajadores que han presenciado Acontecimientos Traumáticos Severos (ATS) a través de la Guía I, para que el Patrón pueda cumplir con su obligación de derivarlos a una institución médica o psicológica.</li>
            </ul>
            <h3>Finalidades Secundarias (Solo para Clientes)</h3>
            <ul>
              <li>Enviar boletines informativos, actualizaciones del sistema o mejoras regulatorias de la NOM-035.</li>
              <li>Realizar análisis estadísticos internos y agregados (totalmente anónimos) para mejorar la usabilidad del software SaaS.</li>
            </ul>
            <p>Si usted es cliente y no desea recibir correos informativos o secundarios, puede solicitar su baja en cualquier momento escribiendo a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
          </section>

          <section>
            <h2>5. ¿Con quién compartimos la información? (Transferencia de Datos)</h2>
            <p><strong>No vendemos, rentamos ni comercializamos datos personales.</strong></p>
            <ul>
              <li><strong>Datos de los Clientes:</strong> Se transfieren únicamente a proveedores tecnológicos necesarios para la operación del SaaS (hosting seguro, servicios de correo transaccional y la pasarela de pagos) y a las autoridades fiscales cuando la ley lo exija.</li>
              <li><strong>Datos de los Trabajadores:</strong> Las respuestas y diagnósticos individuales de las encuestas se comparten únicamente con el Administrador de la cuenta o el Consultor autorizado por la empresa empleadora. El Operador de la Plataforma jamás transferirá estos datos a ningún tercero ajeno a la relación laboral entre el trabajador y su patrón, salvo requerimiento judicial expreso.</li>
            </ul>
          </section>

          <section>
            <h2>6. ¿Cómo protegemos la información?</h2>
            <p>Para resguardar los datos de salud mental, factores de riesgo psicosocial y datos corporativos, implementamos estrictas medidas de seguridad administrativas, técnicas y físicas superiores a las del promedio de la industria:</p>
            <ul>
              <li><strong>Encriptación de datos:</strong> Toda la transmisión de información viaja cifrada mediante protocolo seguro HTTPS (SSL/TLS).</li>
              <li><strong>Seguridad en Servidores:</strong> Las bases de datos se encuentran en servidores con esquemas de seguridad avanzados y actualizaciones de seguridad constantes.</li>
              <li><strong>Confidencialidad en la NOM-035:</strong> La Plataforma permite al patrón configurar encuestas de forma que las respuestas se traten con la debida secrecía, limitando el acceso de los reportes detallados únicamente al personal de recursos humanos o médicos ocupacionales autorizados.</li>
            </ul>
          </section>

          <section>
            <h2>7. ¿Cómo ejercer sus Derechos ARCO y revocar el consentimiento?</h2>
            <p>Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso); solicitar la corrección de su información en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos se conocen como Derechos ARCO.</p>
            <h3>Si es usted un Cliente (Empresa o Consultor)</h3>
            <p>Puede ejercer sus derechos enviando una solicitud formal a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Su solicitud deberá incluir:</p>
            <ul>
              <li>Nombre completo del titular.</li>
              <li>Documento oficial que acredite su identidad (INE o Pasaporte escaneado).</li>
              <li>Descripción clara de los datos sobre los que busca ejercer alguno de los derechos ARCO.</li>
              <li>Cualquier otro elemento que facilite la localización de los datos.</li>
            </ul>
            <h3>Si es usted un Trabajador/Colaborador</h3>
            <p>Dado que la Plataforma actúa únicamente como procesador de datos (“Encargado”) de su patrón, deberá dirigir su solicitud de Derechos ARCO directamente al departamento de Recursos Humanos o representante legal de la empresa para la que labora. Nosotros coadyuvaremos de inmediato con su patrón para hacer valer su solicitud una vez que ellos nos lo indiquen.</p>
            <p>Recibida una solicitud válida, daremos respuesta en un plazo máximo de 20 días hábiles.</p>
          </section>

          <section>
            <h2>8. Uso de Cookies y Tecnologías de Rastreo</h2>
            <p>Nuestra Plataforma utiliza “cookies” y tecnologías similares estrictamente necesarias para el correcto funcionamiento técnico del software SaaS (como mantener iniciada la sesión del usuario, recordar el progreso del cuestionario y asegurar el balanceo de carga). No utilizamos cookies de seguimiento publicitario ni de marketing de terceros dentro de los cuestionarios que responden los trabajadores.</p>
            <p>Usted puede configurar su navegador web para deshabilitar las cookies; sin embargo, tome en cuenta que esto podría afectar o inhabilitar funciones críticas de la Plataforma.</p>
          </section>

          <section>
            <h2>9. Cambios al Aviso de Privacidad</h2>
            <p>El Operador de la Plataforma se reserva el derecho de modificar o actualizar este Aviso de Privacidad en respuesta a reformas legislativas, políticas internas, requerimientos de la STPS sobre la NOM-035 o nuevas funcionalidades del software.</p>
            <p>Cualquier cambio sustancial será notificado a través de un aviso destacado en nuestra página web o mediante el envío de un correo electrónico a los administradores de las cuentas activas.</p>
          </section>

          <section>
            <h2>10. Consentimiento del Usuario</h2>
            <p>Al registrarse como Cliente (Empresa o Consultor), usted acepta de manera expresa los términos de este Aviso de Privacidad y el tratamiento de sus datos corporativos y de facturación.</p>
            <p>Al contestar las evaluaciones como Trabajador, usted otorga su consentimiento expreso para el procesamiento de sus datos de identificación laboral y datos de salud (datos sensibles necesarios para cumplir con las Guías de la NOM-035-STPS-2018), bajo el entendido de que su patrón es el Responsable legal de dicha información y el Operador de la Plataforma es únicamente el facilitador técnico del servicio.</p>
          </section>
        </div>

        <footer className="privacy-footer">
          <Building size={18} aria-hidden="true" />
          <span>NOM-035 · Evaluación y Diagnóstico</span>
          <Link to="/login"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
        </footer>
      </article>
    </main>
  );
}
