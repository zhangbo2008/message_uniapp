<template>
	<view class="container">
		<view class="header">
			<text class="title">最新留言</text>
		</view>
		
		<view class="message-list">
			<view v-if="messages.length === 0" class="empty">
				<text>暂无留言，快来发布第一条留言吧！</text>
			</view>
			
			<view v-for="message in messages" :key="message.id" class="message-item">
				<view class="message-header">
					<image :src="message.avatar" class="avatar" mode="aspectFill"></image>
					<view class="user-info">
						<text class="user-name">{{message.userName}}</text>
						<text class="time">{{message.time}}</text>
					</view>
				</view>
				
				<view class="message-content">
					<text class="message-title">{{message.title}}</text>
					<text class="message-text">{{message.content}}</text>
				</view>
				
				<view class="message-footer">
					<view class="like-btn" @click="toggleLike(message)">
						<text class="icon">{{message.liked ? '❤️' : '🤍'}}</text>
						<text class="count">{{message.like_count || 0}}</text>
					</view>
					<button class="delete-btn" size="mini" type="warn" @click="deleteMessage(message.id)">删除</button>
				</view>
			</view>
		</view>
	</view>
</template>


















<script>
export default {
	data() {
		return {
			messages: []
		}
	},
	onShow() {
		// 每次页面显示时重新加载数据
		this.loadMessages();
	},
	methods: {
		loadMessages() {
			// 从后端加载留言数据
			const userInfo = uni.getStorageSync('userInfo') || {};
			const userId = userInfo.userId || 'guest';
			
			uni.request({
				url: 'http://localhost:3000/api/messages',
				method: 'GET',
				data: {
					user_id: userId
				},
				success: (res) => {
					if (res.statusCode === 200) {
						// 将后端时间戳转换为本地时间格式
						this.messages = res.data.map(msg => ({
							...msg,
							time: new Date(msg.created_at).toLocaleString()
						}));
						console.log(this.messages)
					}
				},
				fail: () => {
					uni.showToast({
						title: '加载失败，请稍后重试',
						icon: 'none'
					});
					// 使用本地存储作为备用
					this.loadLocalMessages();
				}
			});
		},
		loadLocalMessages() {
			// 从本地存储加载留言数据（备用）
			let messages = uni.getStorageSync('messages') || [];
			this.messages = messages;
		},
		toggleLike(message) {
			const userInfo = uni.getStorageSync('userInfo') || {};
			const userId = userInfo.userId || 'guest';
			
			uni.request({
				url: `http://localhost:3000/api/messages/${message.id}/like`,
				method: 'POST',
				data: {
					user_id: userId
				},
				success: (res) => {
					if (res.statusCode === 200) {
						message.liked = res.data.liked;
						message.like_count += res.data.liked ? 1 : -1;
						console.log(message);
						console.log(2222222222)
						console.log(res.data.liked);
						console.log(message.like_count)
						console.log(message.like_count)
						uni.showToast({
							title: res.data.liked ? '点赞成功' : '取消点赞',
							icon: 'success'
						});
					}
				},
				fail: () => {
					// 失败时使用本地逻辑
					message.liked = !message.liked;
					message.like_count = message.like_count || 0;
					message.like_count += message.liked ? 1 : -1;
					
					uni.showToast({
						title: '操作失败，已使用本地模式',
						icon: 'none'
					});
				}
			});
		},
		deleteMessage(messageId) {
			const userInfo = uni.getStorageSync('userInfo') || {};
			const userId = userInfo.userId || 'guest';
			
			uni.showModal({
				title: '提示',
				content: '确定要删除这条留言吗？',
				success: (res) => {
					if (res.confirm) {
						uni.request({
							url: `http://localhost:3000/api/messages/${messageId}`,
							method: 'DELETE',
							data: {
								user_id: userId
							},
							success: (res) => {
								if (res.statusCode === 200) {
									// 重新加载留言列表
									this.loadMessages();
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
								} else if (res.statusCode === 404) {
									uni.showToast({
										title: '留言不存在或无权删除',
										icon: 'none'
									});
								}
							},
							fail: () => {
								// 失败时使用本地逻辑
								this.messages = this.messages.filter(msg => msg.id !== messageId);
								uni.showToast({
									title: '删除失败，已使用本地模式',
									icon: 'none'
								});
							}
						});
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

.header {
	margin-bottom: 30rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.message-list {
	min-height: 600rpx;
}

.empty {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
	font-size: 28rpx;
}

.message-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.message-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.user-name {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 5rpx;
}

.time {
	display: block;
	font-size: 22rpx;
	color: #999;
}

.message-content {
	margin-bottom: 20rpx;
}

.message-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 15rpx;
}

.message-text {
	display: block;
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
	word-break: break-all;
}

.message-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 1rpx solid #f0f0f0;
}

.like-btn {
	display: flex;
	align-items: center;
}

.icon {
	font-size: 32rpx;
	margin-right: 10rpx;
}

.count {
	font-size: 24rpx;
	color: #999;
}

.delete-btn {
	padding: 0 20rpx;
	font-size: 24rpx;
}
</style>
