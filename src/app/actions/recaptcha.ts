
'use server';

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

interface AssessmentParams {
  token: string;
  recaptchaAction: string;
}

/**
 * Crea una evaluación para analizar el riesgo de una acción de la IU.
 *
 * projectID: El ID del proyecto de Google Cloud.
 * recaptchaSiteKey: La clave reCAPTCHA asociada con el sitio o la aplicación
 * token: El token generado obtenido del cliente.
 * recaptchaAction: El nombre de la acción que corresponde al token.
 */
export async function createAssessment({
  token,
  recaptchaAction,
}: AssessmentParams): Promise<number | null> {
  const projectID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!projectID || !recaptchaKey) {
    console.error("Project ID or reCAPTCHA Site Key is not defined in environment variables.");
    return null;
  }
  
  // Crea el cliente de reCAPTCHA.
  // TODO: almacena en caché el código de generación de clientes (recomendado) o llama a client.close() antes de salir del método.
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(projectID);

  // Crea la solicitud de evaluación.
  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  };

  try {
    const [response] = await client.createAssessment(request);

    // Verifica si el token es válido.
    if (!response.tokenProperties?.valid) {
      console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties?.invalidReason}`);
      return null;
    }

    // Verifica si se ejecutó la acción esperada.
    // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
    if (response.tokenProperties.action === recaptchaAction) {
      // Obtén la puntuación de riesgo y los motivos.
      // Para obtener más información sobre cómo interpretar la evaluación, consulta:
      // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
      console.log(`The reCAPTCHA score is: ${response.riskAnalysis?.score}`);
      response.riskAnalysis?.reasons.forEach((reason) => {
        console.log(reason);
      });

      return response.riskAnalysis?.score ?? null;
    } else {
      console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
      return null;
    }
  } catch (error) {
    console.error("Error creating reCAPTCHA assessment:", error);
    return null;
  }
}
