const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 连接数据库
const db = new sqlite3.Database('./message_board.db', (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('成功连接到SQLite数据库');
        // 创建表
        createTables();
    }
});

// 创建数据表
function createTables() {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        user_name TEXT,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 留言表
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        user_id TEXT,
        user_name TEXT,
        avatar TEXT,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`);
    
    // 点赞表
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id),
        FOREIGN KEY (message_id) REFERENCES messages(id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`);
}

// API路由

// 获取所有留言
app.get('/api/messages', (req, res) => {
    const sql = `SELECT m.*, 
                CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as liked 
                FROM messages m 
                LEFT JOIN likes l ON m.id = l.message_id AND l.user_id = ? 
                ORDER BY m.created_at DESC`;
    
    const userId = req.query.user_id || 'guest';
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 创建留言
app.post('/api/messages', (req, res) => {
    const { title, content, user_id, user_name, avatar } = req.body;
    
    if (!title || !content || !user_id || !user_name) {
        res.status(400).json({ error: '缺少必要参数' });
        return;
    }
    
    const sql = `INSERT INTO messages (title, content, user_id, user_name, avatar) 
                VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [title, content, user_id, user_name, avatar || '/static/logo.png'], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // 返回创建的留言
        db.get(`SELECT * FROM messages WHERE id = ?`, [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json(row);
        });
    });
});

// 删除留言
app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
        res.status(400).json({ error: '缺少用户ID' });
        return;
    }
    
    // 检查留言是否存在且属于该用户
    db.get(`SELECT * FROM messages WHERE id = ? AND user_id = ?`, [id, user_id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: '留言不存在或无权删除' });
            return;
        }
        
        // 删除相关点赞
        db.run(`DELETE FROM likes WHERE message_id = ?`, [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 删除留言
            db.run(`DELETE FROM messages WHERE id = ?`, [id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true });
            });
        });
    });
});

// 点赞/取消点赞
app.post('/api/messages/:id/like', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
        res.status(400).json({ error: '缺少用户ID' });
        return;
    }
    
    // 检查是否已点赞
    db.get(`SELECT * FROM likes WHERE message_id = ? AND user_id = ?`, [id, user_id], (err, likeRow) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (likeRow) {
            // 取消点赞
            db.run(`DELETE FROM likes WHERE id = ?`, [likeRow.id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // 更新点赞数
                db.run(`UPDATE messages SET like_count = like_count - 1 WHERE id = ?`, [id], (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ liked: false });
                });
            });
        } else {
            // 点赞
            db.run(`INSERT INTO likes (message_id, user_id) VALUES (?, ?)`, [id, user_id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // 更新点赞数
                db.run(`UPDATE messages SET like_count = like_count + 1 WHERE id = ?`, [id], (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ liked: true });
                });
            });
        }
    });
});

// 获取用户信息
app.get('/api/users/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    db.get(`SELECT * FROM users WHERE user_id = ?`, [user_id], (err, userRow) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!userRow) {
            // 如果用户不存在，创建默认用户
            const defaultUser = {
                user_id: user_id,
                user_name: '用户' + user_id.slice(-4),
                avatar: '/static/logo.png'
            };
            
            db.run(`INSERT INTO users (user_id, user_name, avatar) VALUES (?, ?, ?)`, 
                [defaultUser.user_id, defaultUser.user_name, defaultUser.avatar], 
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // 获取用户统计信息
                    getUserStats(defaultUser.user_id, res);
                }
            );
        } else {
            // 获取用户统计信息
            getUserStats(user_id, res);
        }
    });
});

// 获取用户统计信息
function getUserStats(user_id, res) {
    db.get(`SELECT 
            (SELECT COUNT(*) FROM messages WHERE user_id = ?) as total_messages,
            (SELECT SUM(like_count) FROM messages WHERE user_id = ?) as total_likes
            `, [user_id, user_id], (err, stats) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.get(`SELECT * FROM users WHERE user_id = ?`, [user_id], (err, userRow) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                ...userRow,
                total_messages: stats.total_messages || 0,
                total_likes: stats.total_likes || 0
            });
        });
    });
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
});