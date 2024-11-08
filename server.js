const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'tiger',
    database: 'velox_db',
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve Static Files (HTML, CSS, JS)
app.use(express.static('public'));

// Connect to the database
db.connect((err) => {
    if (err) throw err;
    console.log('Database connected!');
});



// Check if username already exists
app.post('/check-username', (req, res) => {
    const { username } = req.body;
    
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

// Registration Route
// Check if username already exists
app.post('/check-username', (req, res) => {
    const { username } = req.body;
    
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

app.post('/admin', (req, res) => {
    res.redirect('./public/admin.html');


});

// Registration Route
app.post('/register', (req, res) => {
    const { username, email, role, password } = req.body;

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        // Check if username already exists
        const query = 'SELECT * FROM users WHERE username = ?';
        db.query(query, [username], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                // Return error response if username exists
                return res.send(`
                    <script>
                        document.body.innerHTML = '<div class="error-message">Username already exists! Try something else. Suggested: ${username}_123</div>';
                        setTimeout(() => {
                            window.location.href = '/register.html';  // Reload registration page
                        }, 3000);
                    </script>
                `);
            } else {
                // Insert user into the database
                const insertQuery = 'INSERT INTO users (username, email, role, password, day) VALUES (?, ?, ?, ?, ?)';
                db.query(insertQuery, [username, email, role, hashedPassword, 'ta'], (err, result) => {
                    if (err) throw err;

                    // Redirect to the login page after successful registration
                    res.redirect('/login.html');
                });
            }
        });
    });
});
// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query to find the user by username
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];

            // Compare the hashed password
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) throw err;

                if (match) {
                    // Send back user data if login is successful
                    res.json({ success: true, user: { username: user.username, email: user.email } });
                } else {
                    res.json({ success: false });
                }
            });
        } else {
            res.json({ success: false });
        }
    });
});

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: "public/uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Route for adding slider item from admin.html
app.post("/add-slider", upload.single("image"), (req, res) => {
    const { title, description } = req.body;
    const imageUrl = "/uploads/" + req.file.filename;

    db.query(
        "INSERT INTO sliders (image_url, title, description) VALUES (?, ?, ?)",
        [imageUrl, title, description],
        (err) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error saving slider item.");
            } else {
                res.redirect("/admin.html");
            }
        }
    );
});

// Route to fetch slider items for deshboard.html
app.get("/get-sliders", (req, res) => {
    db.query("SELECT * FROM sliders", (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error fetching sliders.");
        } else {
            res.json(results);
        }
    });
});

// Route to add a work item
app.post("/add-work", upload.single("image"), (req, res) => {
    const { title, description, website_url } = req.body;
    const image_path = "/uploads/" + req.file.filename;

    const sql = "INSERT INTO  work_items (title, description, image_path, website_url) VALUES (?, ?, ?, ?)";
    db.query(sql, [title, description, image_path, website_url], (err, result) => {
        if (err) return res.status(500).send("Database error: " + err);
        res.redirect("/admin.html");
    });
});

// Route to retrieve work items for the main page
app.get("/work-items", (req, res) => {
    db.query("SELECT * FROM  work_items", (err, results) => {
        if (err) return res.status(500).send("Database error: " + err);
        res.json(results);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer({ dest: 'uploads/' }).single('file'));

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or use any other service like SendGrid or Mailgun
    auth: {
        user: 'your-email@gmail.com', // Use your company's email here
        pass: 'your-email-password', // Your email password or app password
    },
});

// POST route for form submission
app.post('/submit-repair-form', (req, res) => {
    const { deviceType, issueType, urgency, description } = req.body;
    const file = req.file ? req.file.path : null;

    // Basic form validation (you can customize this as needed)
    if (!deviceType || !issueType || !urgency) {
        // Sending email on error
        const mailOptions = {
            from: 'your-email@gmail.com', // From email address (use your email)
            to: 'company-email@example.com', // Company email address to receive the error message
            subject: 'Error in Repair Form Submission',
            text: `There was an error with the repair form submission. Below are the details:
                
                Device Type: ${deviceType || 'Not Provided'}
                Issue Type: ${issueType || 'Not Provided'}
                Urgency: ${urgency || 'Not Provided'}
                Description: ${description || 'Not Provided'}
                File Uploaded: ${file || 'No file uploaded'}

                Please check the form submission process.`,
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending email');
            }
            res.status(400).send('Form submission failed. The issue has been reported to the company.');
        });
    } else {
        // Handle successful form submission here (store data in DB, etc.)
        res.status(200).send('Form submitted successfully');
    }
});

// Start the server
app.listen(2711, () => {
    console.log('Server running on port 2711');
});
