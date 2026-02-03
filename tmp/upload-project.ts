import { S3Storage } from "coze-coding-dev-sdk";

/**
 * 上传项目代码到对象存储
 */
export async function uploadProjectCode() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  try {
    // 读取压缩包
    const fs = require('fs');
    const fileContent = fs.readFileSync('/tmp/tianjige-project.tar.gz');

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: Buffer.from(fileContent),
      fileName: 'tianjige-project.tar.gz',
      contentType: 'application/gzip',
    });

    console.log('项目代码已上传:', fileKey);

    // 生成下载链接（有效期 7 天）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7 天
    });

    console.log('下载链接:', downloadUrl);

    return { fileKey, downloadUrl };
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
}
