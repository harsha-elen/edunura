import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

interface PaymentAttributes {
    id: number;
    order_id: string;
    payment_id?: string;
    user_id: number;
    course_id: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    receipt?: string;
    razorpay_signature?: string;
    error_message?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'payment_id' | 'status' | 'receipt' | 'razorpay_signature' | 'error_message' | 'created_at' | 'updated_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: number;
    public order_id!: string;
    public payment_id?: string;
    public user_id!: number;
    public course_id!: number;
    public amount!: number;
    public currency!: string;
    public status!: PaymentStatus;
    public receipt?: string;
    public razorpay_signature?: string;
    public error_message?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Payment.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        payment_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        course_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(10),
            defaultValue: 'INR',
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(PaymentStatus)),
            defaultValue: PaymentStatus.PENDING,
            allowNull: false,
        },
        receipt: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        razorpay_signature: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'payments',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['order_id', 'user_id', 'course_id'],
                name: 'unique_payment_order',
            },
        ],
    }
);

export default Payment;
