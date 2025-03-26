import { model, Schema } from 'mongoose';

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['income', 'costs'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

transactionSchema.index({ userId: 1, date: 1 });

const Transaction = model('Transaction', transactionSchema);

export default Transaction;