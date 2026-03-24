import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class EmailOtp extends Model {
    public id!: number;
    public email!: string;
    public otp!: string;
    public expires_at!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

EmailOtp.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'email_otps',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default EmailOtp;
