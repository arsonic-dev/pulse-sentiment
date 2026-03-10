const text = `id,source,category,text
1,app_store,product_review,"Absolutely love this app! It has completely transformed the way I manage my daily tasks. The interface is clean, intuitive, and the performance is blazing fast. Best purchase I've made all year."
2,app_store,product_review,"The app crashes every single time I try to open it on my iPhone 14. I've reinstalled three times and nothing works. Completely useless garbage. I want a refund."
3,twitter,customer_support,"@company Support has been incredibly helpful. They resolved my billing issue in under 5 minutes and even offered a free month of premium. Thank you! 🙏"
4,reddit,feature_request,"Why is there STILL no dark mode? Every other app has had this for years. It's ridiculous that we're blinding ourselves at night just to check our feed. Please fix this."
5,play_store,product_review,"It's okay I guess. It does what it says but there are better alternatives out there. The UI feels a bit dated."
6,email,feedback,"The recent update broke the syncing feature. None of my devices are updating. This is critical for my workflow and I'm losing time."
7,app_store,product_review,"Five stars! The new AI integration is mind-blowing. It saves me so much typing. Highly recommend to everyone."
8,twitter,customer_support,"I've been on hold for 45 minutes. Your customer service is nonexistent. This is unacceptable."
9,reddit,general_discussion,"Just discovered this tool and I'm shocked it's free. The developers are doing god's work. Anyone know if there's a Patreon?"
10,play_store,product_review,"Too many ads. You click one button and get a 30 second unskippable video. Uninstalling."`;

fetch('http://localhost:8081/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
}).then(async r => {
    console.log('Status:', r.status);
    console.log('Body:', await r.text());
}).catch(console.error);
