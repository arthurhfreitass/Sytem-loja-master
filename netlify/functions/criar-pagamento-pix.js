// netlify/functions/criar-pagamento-pix.js

// Importa a SDK do Mercado Pago
const mercadopago = require("mercadopago");

// --- DOCUMENTAÇÃO ---
// Handler principal da nossa função Netlify.
// É o código que será executado quando a função for chamada.
exports.handler = async (event, context) => {
  // Verifica se a requisição é do tipo POST, que é mais segura para enviar dados
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Configura a SDK do Mercado Pago com o seu Access Token.
  // IMPORTANTE: O Access Token é puxado de uma variável de ambiente da Netlify.
  // Isso mantém sua chave secreta e segura!
  mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });

  // Pega os dados do produto que o frontend enviou
  const { description, price, email } = JSON.parse(event.body);
  
  const valorDoPagamento = Number(price);

  // --- DOCUMENTAÇÃO ---
  // Objeto de pagamento que será enviado para a API do Mercado Pago.
  const paymentData = {
    transaction_amount: valorDoPagamento, // Valor total do pagamento
    description: description, // Descrição do item
    payment_method_id: "pix", // Método de pagamento é Pix
    payer: {
      email: email, // E-mail do pagador
    },
    // Você pode adicionar uma data de expiração para o QR Code (opcional)
    // date_of_expiration: "2025-12-01T23:59:59.000-03:00" 
  };

  try {
    // --- DOCUMENTAÇÃO ---
    // Cria o pagamento usando a SDK do Mercado Pago
    const response = await mercadopago.payment.create(paymentData);
    
    // Extrai os dados importantes da resposta da API para enviar ao frontend
    const pixData = {
      id: response.body.id,
      qr_code_base64: response.body.point_of_interaction.transaction_data.qr_code_base64,
      qr_code: response.body.point_of_interaction.transaction_data.qr_code,
    };

    // Retorna os dados do Pix para o frontend com sucesso (código 200)
    return {
      statusCode: 200,
      body: JSON.stringify(pixData),
    };

  } catch (error) {
    // Em caso de erro, loga o erro e retorna uma mensagem para o frontend
    console.error("Erro ao criar pagamento Pix:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao criar o pagamento." }),
    };
  }
};