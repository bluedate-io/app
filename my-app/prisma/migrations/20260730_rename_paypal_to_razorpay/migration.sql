-- Rename paypalSubscriptionId to razorpaySubscriptionId
ALTER TABLE "subscriptions" RENAME COLUMN "paypalSubscriptionId" TO "razorpaySubscriptionId";
