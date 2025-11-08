<template>
	<view class="container">
		<view class="form-item">
			<text class="label">留言标题</text>
			<input class="input" v-model="message.title" type="text" placeholder="请输入留言标题" />
		</view>
		<view class="form-item">
			<text class="label">留言内容</text>
			<textarea class="textarea" v-model="message.content" placeholder="请输入留言内容" rows="6"></textarea>
		</view>
		<button class="submit-btn" @click="submitMessage">发布留言</button>
	</view>
</template>

<script>
export default {
	data() {
		return {
			message: {
				title: '',
				content: ''
			}
		}
	},
	methods: {
		submitMessage() {
			if (!this.message.title || !this.message.content) {
				uni.showToast({
					title: '请填写标题和内容',
					icon: 'none'
				});
				return;
			}
			
			// 获取用户信息
			let userInfo = uni.getStorageSync('userInfo') || {
				userName: '测试用户',
				userId: 'user_001',
				avatar: '/static/logo.png'
			};
			
			// 保存用户信息（如果不存在）
			if (!uni.getStorageSync('userInfo')) {
				uni.setStorageSync('userInfo', userInfo);
			}
			
			// 发送到后端
			uni.request({
				url: 'http://localhost:3000/api/messages',
				method: 'POST',
				data: {
					title: this.message.title,
					content: this.message.content,
					user_id: userInfo.userId,
					user_name: userInfo.userName,
					avatar: userInfo.avatar
				},
				success: (res) => {
					if (res.statusCode === 201) {
						uni.showToast({
							title: '发布成功',
							icon: 'success'
						});
						
						// 清空表单
						this.message.title = '';
						this.message.content = '';
						
						// 跳转到留言列表页
						uni.switchTab({
							url: '/pages/index/index'
						});
					}
				},
				fail: () => {
					// 后端请求失败，使用本地存储作为备用
					this.saveMessageLocally(userInfo);
				}
			});
		},
		saveMessageLocally(userInfo) {
			// 保存到本地存储（备用方案）
			const newMessage = {
				id: Date.now(),
				title: this.message.title,
				content: this.message.content,
				userName: userInfo.userName,
				avatar: userInfo.avatar,
				time: new Date().toLocaleString()
			};
			
			let messages = uni.getStorageSync('messages') || [];
			messages.unshift(newMessage);
			uni.setStorageSync('messages', messages);
			
			uni.showToast({
				title: '网络异常，已保存到本地',
				icon: 'none'
			});
			
			// 清空表单
			this.message.title = '';
			this.message.content = '';
			
			// 跳转到留言列表页
			uni.switchTab({
				url: '/pages/index/index'
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

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	margin-bottom: 10rpx;
	font-size: 28rpx;
	color: #333;
}

.input {
	width: 100%;
	padding: 20rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.textarea {
	width: 100%;
	padding: 20rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	font-size: 28rpx;
	min-height: 200rpx;
}

.submit-btn {
	margin-top: 40rpx;
	background-color: #007AFF;
	color: white;
}
</style>