/**
 * Test automatique pour vérifier que le prix d'achat (costPrice) 
 * est correctement retourné par l'API POST /api/products
 */

const API_URL = 'http://localhost:5000';

async function testCostPriceAPI() {
  console.log('🧪 Test: Vérification du prix d\'achat (costPrice)\n');
  
  try {
    // 1. Vérifier que le backend est accessible
    console.log('1️⃣ Vérification de la connexion au backend...');
    const healthCheck = await fetch(`${API_URL}/`);
    const health = await healthCheck.json();
    console.log(`   ✅ Backend actif: ${health.message}`);
    console.log(`   📅 Timestamp: ${health.timestamp}\n`);

    // 2. Créer un produit de test avec un prix d'achat spécifique
    console.log('2️⃣ Création d\'un produit de test...');
    const testProduct = {
      name: 'Test Prix Achat ' + Date.now(),
      category: 'Test',
      description: 'Produit de test pour vérifier costPrice',
      imageUrl: '',
      attributes: [],
      variants: [
        {
          selectedOptions: {},
          price: 150.00,
          costPrice: 89.50,  // ← Prix d'achat à tester
          sku: 'TEST-' + Date.now(),
          barcode: null,
          stock_quantity: 25
        }
      ],
      tenantId: 1,
      storeId: 1,
      low_stock_threshold: 5,
      enable_email_alert: false
    };

    console.log('   📦 Données envoyées:');
    console.log('      - Prix de vente: 150.00');
    console.log('      - Prix d\'achat: 89.50');
    console.log('      - Stock initial: 25\n');

    const createResponse = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Erreur API: ${error.error || createResponse.statusText}`);
    }

    const createdProduct = await createResponse.json();
    console.log('   ✅ Produit créé avec ID:', createdProduct.id);

    // 3. Vérifier la réponse POST
    console.log('\n3️⃣ Vérification de la réponse POST...');
    
    if (!createdProduct.variants || createdProduct.variants.length === 0) {
      throw new Error('❌ Aucune variante retournée');
    }

    const variant = createdProduct.variants[0];
    console.log('   📊 Variante retournée:');
    console.log('      - ID:', variant.id);
    console.log('      - price:', variant.price);
    console.log('      - costPrice:', variant.costPrice);
    console.log('      - cost_price:', variant.cost_price);
    console.log('      - stock_quantity:', variant.stock_quantity);

    // Vérifications
    const checks = [];
    
    // Check 1: costPrice existe (camelCase)
    if (variant.hasOwnProperty('costPrice')) {
      console.log('   ✅ Propriété "costPrice" (camelCase) présente');
      checks.push(true);
    } else {
      console.log('   ❌ Propriété "costPrice" (camelCase) MANQUANTE');
      checks.push(false);
    }

    // Check 2: costPrice a la bonne valeur
    if (variant.costPrice === 89.50 || variant.costPrice === '89.50') {
      console.log('   ✅ Valeur costPrice correcte: 89.50');
      checks.push(true);
    } else {
      console.log(`   ❌ Valeur costPrice incorrecte: ${variant.costPrice} (attendu: 89.50)`);
      checks.push(false);
    }

    // Check 3: cost_price ne devrait PAS être présent (snake_case)
    if (!variant.hasOwnProperty('cost_price')) {
      console.log('   ✅ Pas de propriété "cost_price" (snake_case) - format correct');
      checks.push(true);
    } else {
      console.log('   ⚠️  Propriété "cost_price" (snake_case) présente - devrait être camelCase');
      checks.push(false);
    }

    // Check 4: price est correct
    const priceValue = parseFloat(variant.price);
    if (priceValue === 150) {
      console.log('   ✅ Prix de vente correct: 150.00');
      checks.push(true);
    } else {
      console.log(`   ❌ Prix de vente incorrect: ${variant.price}`);
      checks.push(false);
    }

    // Check 5: stock_quantity est correct
    if (variant.stock_quantity === 25) {
      console.log('   ✅ Stock initial correct: 25');
      checks.push(true);
    } else {
      console.log(`   ❌ Stock initial incorrect: ${variant.stock_quantity}`);
      checks.push(false);
    }

    // 4. Vérifier avec GET pour comparaison
    console.log('\n4️⃣ Vérification avec GET /api/products...');
    const getResponse = await fetch(`${API_URL}/api/products`);
    const allProducts = await getResponse.json();
    const productFromGet = allProducts.find(p => p.id === createdProduct.id);

    if (productFromGet) {
      const variantFromGet = productFromGet.variants[0];
      console.log('   📊 Variante depuis GET:');
      console.log('      - costPrice:', variantFromGet.costPrice);
      console.log('      - price:', variantFromGet.price);
      
      // Comparer les valeurs numériques (pas le formatage)
      const postCostPrice = parseFloat(variant.costPrice);
      const getCostPrice = parseFloat(variantFromGet.costPrice);
      
      if (postCostPrice === getCostPrice) {
        console.log('   ✅ Format cohérent entre POST et GET (valeurs identiques)');
        checks.push(true);
      } else {
        console.log('   ❌ Format incohérent entre POST et GET');
        checks.push(false);
      }
    }

    // 5. Résultat final
    console.log('\n' + '='.repeat(60));
    const allPassed = checks.every(check => check === true);
    const passedCount = checks.filter(check => check === true).length;
    
    if (allPassed) {
      console.log('✅ TOUS LES TESTS RÉUSSIS (' + passedCount + '/' + checks.length + ')');
      console.log('Le prix d\'achat (costPrice) est correctement retourné en camelCase');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ (' + passedCount + '/' + checks.length + ')');
      console.log('Des corrections sont nécessaires');
    }
    console.log('='.repeat(60));

    // 6. Nettoyage (optionnel)
    console.log('\n5️⃣ Nettoyage...');
    const deleteResponse = await fetch(`${API_URL}/api/products/${createdProduct.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('   ✅ Produit de test supprimé');
    } else {
      console.log('   ⚠️  Impossible de supprimer le produit de test (ID: ' + createdProduct.id + ')');
    }

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LE TEST:');
    console.error('   ', error.message);
    console.error('\n💡 Vérifiez que:');
    console.error('   - Le backend est démarré (cd backend && npm run dev)');
    console.error('   - Le backend écoute sur http://localhost:5000');
    console.error('   - La base de données PostgreSQL est accessible');
    process.exit(1);
  }
}

// Exécuter le test
testCostPriceAPI();
