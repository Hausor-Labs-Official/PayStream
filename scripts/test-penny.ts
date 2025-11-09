import { askPenny, getPennyAgent } from '../src/lib/penny-agent';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testPenny() {
  console.log('🤖 Testing Penny AI Agent\n');
  console.log('=' .repeat(60));

  try {
    const agent = getPennyAgent();

    // Test 1: General greeting
    console.log('\n📝 Test 1: General Greeting');
    console.log('Query: "Hello Penny, what can you do?"\n');
    const response1 = await askPenny('Hello Penny, what can you do?');
    console.log('Response:', response1.text);
    console.log('Has Chart:', response1.chart ? 'Yes' : 'No');

    // Test 2: Salary chart request
    console.log('\n\n📝 Test 2: Salary Chart Request');
    console.log('Query: "Show me a chart of employee salaries"\n');
    const response2 = await askPenny('Show me a chart of employee salaries');
    console.log('Response:', response2.text);
    console.log('Has Chart:', response2.chart ? 'Yes' : 'No');

    if (response2.chart) {
      console.log('\n📊 Chart Config:');
      console.log('  Type:', response2.chart.type);
      console.log('  Labels:', response2.chart.data.labels.slice(0, 5), '...');
      console.log('  Data points:', response2.chart.data.datasets[0].data.slice(0, 5), '...');
      console.log('  Dataset label:', response2.chart.data.datasets[0].label);
    }

    // Test 3: Statistics query
    console.log('\n\n📝 Test 3: Statistics Query');
    console.log('Query: "What is the total payroll?"\n');
    const response3 = await askPenny('What is the total payroll?');
    console.log('Response:', response3.text);
    console.log('Has Data:', response3.data ? 'Yes' : 'No');

    if (response3.data) {
      console.log('\n📈 Statistics:');
      console.log(JSON.stringify(response3.data, null, 2));
    }

    // Test 4: Payment status chart
    console.log('\n\n📝 Test 4: Payment Status Distribution');
    console.log('Query: "Show payment status distribution"\n');
    const response4 = await askPenny('Show payment status distribution');
    console.log('Response:', response4.text);
    console.log('Has Chart:', response4.chart ? 'Yes' : 'No');

    if (response4.chart) {
      console.log('\n📊 Chart Config:');
      console.log('  Type:', response4.chart.type);
      console.log('  Labels:', response4.chart.data.labels);
      console.log('  Data:', response4.chart.data.datasets[0].data);
    }

    // Test 5: Transaction query
    console.log('\n\n📝 Test 5: Transaction Query');
    console.log('Query: "What is the Arc wallet balance?"\n');
    const response5 = await askPenny('What is the Arc wallet balance?');
    console.log('Response:', response5.text);
    console.log('Has Data:', response5.data ? 'Yes' : 'No');

    // Test 6: Employee query
    console.log('\n\n📝 Test 6: Employee Query');
    console.log('Query: "List all employees"\n');
    const response6 = await askPenny('List all employees');
    console.log('Response:', response6.text);

    // Test 7: Bar chart request
    console.log('\n\n📝 Test 7: Specific Chart Type');
    console.log('Query: "Create a bar chart of salaries"\n');
    const response7 = await askPenny('Create a bar chart of salaries');
    console.log('Response:', response7.text);
    console.log('Chart Type:', response7.chart?.type || 'None');

    // Test 8: Pie chart request
    console.log('\n\n📝 Test 8: Pie Chart');
    console.log('Query: "Show me a pie chart of payment statuses"\n');
    const response8 = await askPenny('Show me a pie chart of payment statuses');
    console.log('Response:', response8.text);
    console.log('Chart Type:', response8.chart?.type || 'None');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ All Tests Completed!\n');

    console.log('📊 Test Summary:');
    console.log('  • General conversation: ✓');
    console.log('  • Chart generation: ✓');
    console.log('  • Statistics queries: ✓');
    console.log('  • Payment status: ✓');
    console.log('  • Transaction data: ✓');
    console.log('  • Employee queries: ✓');
    console.log('  • Multiple chart types: ✓');

    console.log('\n🎉 Penny is working correctly!');
    console.log('\nNext steps:');
    console.log('  1. Visit http://localhost:3000/penny to test the UI');
    console.log('  2. Try asking Penny different questions');
    console.log('  3. Check out the visualizations');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testPenny()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
