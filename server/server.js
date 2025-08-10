// Keep server.js as the entry that starts the listener while app logic lives in app.js
const { app } = require('./src/app');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

