import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SettingCategory {
    PAYMENT = 'payment',
    STORAGE = 'storage',
    EMAIL = 'email',
    ZOOM = 'zoom',
    GENERAL = 'general',
    BRANDING = 'branding',
    ORGANIZATION = 'organization',
    LOCALIZATION = 'localization',
}

interface SystemSettingAttributes {
    id: number;
    category: SettingCategory;
    key: string;
    value: string;
    is_encrypted: boolean;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'is_encrypted'> { }

class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
    public id!: number;
    public category!: SettingCategory;
    public key!: string;
    public value!: string;
    public is_encrypted!: boolean;
    public description?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

SystemSetting.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        category: {
            type: DataTypes.ENUM(...Object.values(SettingCategory)),
            allowNull: false,
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_encrypted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'system_settings',
        indexes: [
            {
                fields: ['category'],
            },
        ],
    }
);

export default SystemSetting;
