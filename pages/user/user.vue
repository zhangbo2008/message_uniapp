<template>
	<view class="container">
		<view class="user-info">
			<image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
			<view class="info">
				<text class="user-name">{{userInfo.userName}}</text>
				<text class="user-id">ID: {{userInfo.userId}}</text>
			</view>
		</view>
		
		<view class="stats">
			<view class="stat-item">
				<text class="stat-number">{{userInfo.totalMessages}}</text>
				<text class="stat-label">发布留言</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-number">{{userInfo.totalLikes}}</text>
				<text class="stat-label">收到点赞</text>
			</view>
		</view>
		
		<view class="settings">
			<view class="setting-item" @click="editProfile">
				<text>编辑个人资料</text>
				<text class="arrow">></text>
			</view>
			<view class="setting-item" @click="clearCache">
				<text>清除缓存</text>
				<text class="arrow">></text>
			</view>
			<view class="setting-item" @click="about">
				<text>关于我们</text>
				<text class="arrow">></text>
			</view>
		</view>
		
		<button class="logout-btn" @click="logout">退出登录</button>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userInfo: {
				userName: '测试用户',
				userId: 'user_001',
				avatar: '/static/logo.png',
				totalMessages: 0,
				totalLikes: 0
			}
		}
	},
	onLoad() {
		this.loadUserInfo();
	},
	methods: {
			loadUserInfo() {
				// 获取本地存储的用户信息
				let user = uni.getStorageSync('userInfo');
				
				if (user) {
					this.userInfo = user;
					// 从后端获取用户数据
					this.fetchUserInfoFromServer(user.userId);
				} else {
					// 创建默认用户
					const defaultUser = {
						userName: '测试用户',
						userId: 'user_001',
						avatar: '/static/logo.png',
						totalMessages: 0,
						totalLikes: 0
					};
					this.userInfo = defaultUser;
					uni.setStorageSync('userInfo', defaultUser);
					this.fetchUserInfoFromServer(defaultUser.userId);
				}
			},
			fetchUserInfoFromServer(userId) {
				// 从后端获取用户信息
				uni.request({
					url: `http://localhost:3000/api/users/${userId}`,
					method: 'GET',
					success: (res) => {
						if (res.statusCode === 200) {
							this.userInfo = {
								userName: res.data.user_name,
								userId: res.data.user_id,
								avatar: res.data.avatar || '/static/logo.png',
								totalMessages: res.data.total_messages || 0,
								totalLikes: res.data.total_likes || 0
							};
							// 更新本地存储
							uni.setStorageSync('userInfo', this.userInfo);
						}
					},
					fail: () => {
						console.log('无法从服务器获取用户信息，使用本地数据');
						// 使用本地存储的留言统计
						this.updateLocalStats();
					}
				});
			},
			updateLocalStats() {
				// 统计本地存储中的用户数据
				let messages = uni.getStorageSync('messages') || [];
				const userMessages = messages.filter(msg => msg.userName === this.userInfo.userName);
				this.userInfo.totalMessages = userMessages.length;
				// 简单计算点赞数（实际应该从点赞记录获取）
				this.userInfo.totalLikes = userMessages.reduce((sum, msg) => sum + (msg.like_count || 0), 0);
				uni.setStorageSync('userInfo', this.userInfo);
			},
		editProfile() {
			uni.showToast({
				title: '编辑资料功能开发中',
				icon: 'none'
			});
		},
		clearCache() {
			uni.showModal({
				title: '提示',
				content: '确定要清除缓存吗？',
				success: (res) => {
					if (res.confirm) {
						uni.clearStorageSync();
						uni.showToast({
							title: '缓存已清除',
							icon: 'success'
						});
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}, 1500);
					}
				}
			});
		},
		about() {
			uni.showModal({
				title: '关于我们',
				content: '留言板 v1.0.0\n一个简单的留言板应用',
				showCancel: false
			});
		},
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('userInfo');
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						});
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}, 1500);
					}
				}
			});
		}
	}
}
</script>

<style>
.container {
	padding: 30rpx;
	box-sizing: border-box;
}

.user-info {
	display: flex;
	align-items: center;
	padding: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
}

.avatar {
	width: 150rpx;
	height: 150rpx;
	border-radius: 50%;
	margin-right: 30rpx;
}

.user-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 10rpx;
}

.user-id {
	font-size: 24rpx;
	color: #999;
}

.stats {
	display: flex;
	background-color: #fff;
	border-radius: 16rpx;
	padding: 40rpx 0;
	margin-bottom: 30rpx;
}

.stat-item {
	flex: 1;
	text-align: center;
}

.stat-number {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #007AFF;
	margin-bottom: 10rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #666;
}

.stat-divider {
	width: 1rpx;
	background-color: #eee;
}

.settings {
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
}

.setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
	border-bottom: none;
}

.arrow {
	color: #999;
	font-size: 28rpx;
}

.logout-btn {
	margin-top: 20rpx;
	background-color: #ff3b30;
	color: white;
}
</style>