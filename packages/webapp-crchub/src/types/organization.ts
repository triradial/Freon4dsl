export interface Organization {
    id: string;
    orgTypeId?: string;
    orgSubtypeId?: string;
    key: string;
    name: string;
    isDomain?: boolean;
    staffAvailability?: any;
    organizationAttributes?: any;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
    // Joined fields
    orgTypeName?: string;
    orgSubtypeName?: string;
}

export interface OrgType {
    id: string;
    name: string;
}

export interface OrgSubtype {
    id: string;
    name: string;
}



