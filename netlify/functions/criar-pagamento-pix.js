// netlify/functions/criar-pagamento-pix.js

const mercadopago = require("mercadopago");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });

  try {
    const { description, price, email } = JSON.parse(event.body);
    const valorDoPagamento = Number(price);

    const paymentData = {
      transaction_amount: valorDoPagamento,
      description: description,
      payment_method_id: "pix",
      payer: {
        email: email,
      },
    };

    const response = await mercadopago.payment.create(paymentData);
    
    // --- CORREÇÃO: Retorna a resposta completa da API ---
    return {
      statusCode: 200,
      body: JSON.stringify(response.body),
    };

  } catch (error) {
    console.error("Erro ao criar pagamento Pix:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao criar o pagamento." }),
    };
  }
};