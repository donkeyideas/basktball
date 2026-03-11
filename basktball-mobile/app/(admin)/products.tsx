import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/Colors';

// -- Mock Data --

const PRODUCTS = [
  {
    id: '1',
    name: 'BASKTBALL Pro Jersey - Home',
    sku: 'BSK-JRS-001',
    price: '$89.99',
    stock: 124,
    inStock: true,
  },
  {
    id: '2',
    name: 'BASKTBALL Pro Jersey - Away',
    sku: 'BSK-JRS-002',
    price: '$89.99',
    stock: 87,
    inStock: true,
  },
  {
    id: '3',
    name: 'BASKTBALL Court Shoes V2',
    sku: 'BSK-SHO-010',
    price: '$149.99',
    stock: 45,
    inStock: true,
  },
  {
    id: '4',
    name: 'BASKTBALL Elite Headband',
    sku: 'BSK-ACC-020',
    price: '$19.99',
    stock: 312,
    inStock: true,
  },
  {
    id: '5',
    name: 'BASKTBALL Training Shorts',
    sku: 'BSK-SHR-005',
    price: '$49.99',
    stock: 0,
    inStock: false,
  },
  {
    id: '6',
    name: 'BASKTBALL Signature Basketball',
    sku: 'BSK-BLL-001',
    price: '$34.99',
    stock: 58,
    inStock: true,
  },
];

export default function ProductsScreen() {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.productCount}>
          {PRODUCTS.length} Products
        </Text>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productRow}
            activeOpacity={0.7}
            onPress={() => {
              // Placeholder navigation
            }}
          >
            {/* Image Placeholder */}
            <View style={styles.productImage}>
              <Ionicons
                name="shirt-outline"
                size={28}
                color={Colors.textTertiary}
              />
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productSku}>{product.sku}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productPrice}>{product.price}</Text>
                <View
                  style={[
                    styles.stockBadge,
                    product.inStock
                      ? styles.stockBadgeInStock
                      : styles.stockBadgeOut,
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBadgeText,
                      product.inStock
                        ? styles.stockTextInStock
                        : styles.stockTextOut,
                    ]}
                  >
                    {product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productCount: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.orange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: Fonts.barlowBold,
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Product Row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontFamily: Fonts.barlowBold,
    fontSize: 15,
    color: Colors.white,
    marginBottom: 2,
  },
  productSku: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productPrice: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.orange,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeInStock: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  stockBadgeOut: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  stockBadgeText: {
    fontFamily: Fonts.barlowSemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  stockTextInStock: {
    color: Colors.green,
  },
  stockTextOut: {
    color: Colors.red,
  },

  bottomSpacer: {
    height: 20,
  },
});
